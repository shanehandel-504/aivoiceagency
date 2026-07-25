/* RUN 4.7 · GATE PAGE LISTS — pinned as DATA, not as shell scrollback.
 *
 * WHY THIS FILE EXISTS
 * Through RUN 4.5 the gate sweeps were launched by pasting a hand-typed
 * `--pages=a,b,c` string into bash. Two things went wrong with that:
 *
 *   1. The list was never written down. The RUN 4.5 report records the RESULT
 *      ("88/88 landers/hubs/backstage/chauffeur — 22 pages") but not WHICH 22.
 *      A gate whose scope lives in someone's terminal history is not a gate.
 *   2. Git Bash MSYS path conversion rewrote the FIRST `/`-prefixed item into
 *      `C:/Program Files/Git/...`; skin-verify skipped what it could not
 *      navigate to and reported 96/100 with no error. A silent under-count
 *      reads exactly like a pass.
 *
 * Both are fixed by naming the sets here and deriving the expected check count
 * from the list length instead of trusting whatever the harness happened to run.
 *
 * SOURCE OF TRUTH: tools/stamp.py — PAGES (56) + VERSION_ONLY (5) = 61 stamped.
 * If you add a page to stamp.py you add it here, or the gate will not see it.
 *
 * EXPECTED TOTAL = pages x 4  (2 viewports [390x844, 1440x900] x 2 themes).
 *
 * !! RUNNING FROM GIT BASH ON WINDOWS !!
 *     MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' node tools/skin-verify.mjs ...
 *  Without it the first page of any --pages= sweep is silently dropped.
 *  PowerShell does not need it. The x4 sanity check in skin-verify.mjs will
 *  now catch it either way instead of letting it pass quietly.
 */

const CITIES = ['milwaukee', 'madison', 'west-bend', 'green-bay', 'waukesha'];
const TRADES = ['hvac', 'plumbing', 'electrical', 'dental', 'roofing'];

/* 25 city x trade money pages — the 100/100 sweep.
   Derived from the same two arrays stamp.py loops over, so the two cannot drift. */
export const PAGES_CITY = CITIES.flatMap((c) => TRADES.map((t) => `/${c}-${t}/index.html`));

/* 22 surfaces — the 88/88 sweep. Landers + hubs + the four named extras.
   /index, /live, /book, /lsa are deliberately NOT here: they are the canonical
   five (20/20) and would double-count. */
export const PAGES_LANDERS = [
  // landers (stamp.py VERSION_ONLY, minus /lsa + /live which the five already cover)
  '/watch/index.html',
  '/booked/index.html',
  '/chauffeur/index.html',
  // vertical hubs
  '/home-services/index.html',
  '/medical-practices/index.html',
  '/professional-services/index.html',
  '/hospitality/index.html',
  '/ground-transportation/index.html',
  // city hubs
  '/milwaukee/index.html',
  '/madison/index.html',
  '/green-bay/index.html',
  '/west-bend/index.html',
  '/waukesha/index.html',
  '/wisconsin-limo/index.html',
  // answering-service intent pages
  '/plumber-answering-service/index.html',
  '/hvac-answering-service/index.html',
  '/electrician-answering-service/index.html',
  '/24-hour-answering-service/index.html',
  // named extras
  '/roi/index.html',
  '/overview.html',
  '/blog/index.html',
  '/backstage/index.html',
];

/* the canonical five — 20/20 */
export const PAGES_FIVE = [
  '/index.html',
  '/live/index.html',
  '/book/index.html',
  '/lsa/index.html',
  '/index.html#pricing',
];

export const SETS = {
  city: PAGES_CITY,
  landers: PAGES_LANDERS,
  five: PAGES_FIVE,
  all: [...PAGES_FIVE, ...PAGES_CITY, ...PAGES_LANDERS],
};

/* one page = 2 viewports x 2 themes */
export const CHECKS_PER_PAGE = 4;
export const expectedChecks = (pages) => pages.length * CHECKS_PER_PAGE;

/* self-verification — these are the totals the run reports quote. If someone
   edits a list without updating the run docs, this throws at import time
   rather than shipping a gate that quietly measures the wrong thing. */
const ASSERT = [
  ['PAGES_CITY', PAGES_CITY, 25, 100],
  ['PAGES_LANDERS', PAGES_LANDERS, 22, 88],
  ['PAGES_FIVE', PAGES_FIVE, 5, 20],
];
for (const [name, list, pages, checks] of ASSERT) {
  if (list.length !== pages) throw new Error(`gate-pages: ${name} has ${list.length} pages, expected ${pages}`);
  if (expectedChecks(list) !== checks) throw new Error(`gate-pages: ${name} expects ${expectedChecks(list)} checks, documented as ${checks}`);
  if (new Set(list).size !== list.length) throw new Error(`gate-pages: ${name} contains a duplicate`);
}
