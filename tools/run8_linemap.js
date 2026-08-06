/* AIC RUN 8 · FONT LOCK — line-break map.
 *
 * A self-hosted subset that differs from Google's by one glyph changes where every
 * line wraps. This records, for every text node on a page, the exact set of line
 * boxes the browser produced — count, position, size — and the reconstructed text
 * of each line. Two builds are compared node-for-node; a mismatch names the node
 * and prints both line splits.
 *
 *   node tools/run8_linemap.js capture <before|after> [outdir]
 *   node tools/run8_linemap.js diff <beforeJson> <afterJson>
 *
 * Determinism, because a false "line breaks changed" would abort the run:
 *   · reduced motion  — RUN 7 verified every animation settles on its final state
 *   · Date frozen     — .crush-now prints the reader's real local clock
 *   · fonts.ready + settle delay, then a second read to confirm geometry is stable
 */
const fs = require('fs');
const path = require('path');
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);

// `live` measures production. Byte-identity between the repo and the live HTML is
// necessary but not sufficient: it says the markup matches, not that the CDN is
// serving the font file the markup asks for. Measuring the real line boxes on the
// real host closes that gap.
const BASES = { before: 'http://127.0.0.1:4178', after: 'http://127.0.0.1:4177', live: 'https://aichauffeur.ai' };
const PAGES = ['/', '/demo/', '/limo-answering-service/'];
const WIDTHS = [360, 768, 1280];
const FROZEN = Date.UTC(2026, 7, 5, 19, 30, 0); // 2026-08-05 14:30 CDT — fixed clock

const freezeClock = ts => {
  const Real = Date;
  const F = function (...a) { return a.length ? new Real(...a) : new Real(ts); };
  F.now = () => ts;
  F.parse = Real.parse;
  F.UTC = Real.UTC;
  F.prototype = Real.prototype;
  window.Date = F;
  Math.random = () => 0.42;
};

// Runs in the page. Returns one record per text-bearing node.
const collect = () => {
  const round = n => Math.round(n * 100) / 100;
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const p = n.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
      const cs = getComputedStyle(p);
      if (cs.display === 'none' || cs.visibility === 'hidden') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  // A stable identity for a node across two builds: the DOM path, not an index into
  // a list that a single added element would shift.
  const pathOf = el => {
    const bits = [];
    for (let e = el; e && e.nodeType === 1 && e !== document.body; e = e.parentElement) {
      let i = 1, s = e;
      while ((s = s.previousElementSibling)) if (s.tagName === e.tagName) i++;
      bits.unshift(e.tagName.toLowerCase() + (i > 1 ? `[${i}]` : ''));
    }
    return bits.join('>');
  };

  let n;
  while ((n = walker.nextNode())) {
    const r = document.createRange();
    r.selectNodeContents(n);
    const rects = Array.from(r.getClientRects()).filter(b => b.width > 0 || b.height > 0);
    if (!rects.length) continue;
    const cs = getComputedStyle(n.parentElement);

    // Reconstruct what text landed on each line box, by walking character offsets
    // and watching for the rect index to advance. Capped so a huge node cannot
    // stall the probe.
    let lines = null;
    const text = n.nodeValue;
    if (text.length <= 600) {
      lines = [];
      let cur = '', lastTop = null;
      for (let i = 0; i < text.length; i++) {
        const cr = document.createRange();
        cr.setStart(n, i);
        cr.setEnd(n, i + 1);
        const b = cr.getClientRects()[0];
        const top = b ? Math.round(b.top * 10) / 10 : lastTop;
        if (lastTop !== null && top !== null && Math.abs(top - lastTop) > 1) {
          lines.push(cur); cur = '';
        }
        cur += text[i];
        if (top !== null) lastTop = top;
      }
      if (cur) lines.push(cur);
      lines = lines.map(s => s.trim()).filter(Boolean);
    }

    out.push({
      path: pathOf(n.parentElement),
      tag: n.parentElement.tagName.toLowerCase(),
      cls: (n.parentElement.className || '').toString().slice(0, 60),
      font: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
      size: cs.fontSize,
      weight: cs.fontWeight,
      textHead: text.trim().slice(0, 70),
      textLen: text.trim().length,
      lineCount: rects.length,
      rects: rects.map(b => [round(b.x), round(b.y), round(b.width), round(b.height)]),
      lines,
    });
  }
  return out;
};

async function capture(tag, outdir) {
  const base = BASES[tag];
  if (!base) throw new Error('tag must be before|after|live');
  // NEGATIVE CONTROL. A probe that reports "zero changes" is worthless until it
  // has been shown to report a change when there is one. With RUN8_BLOCK_FONTS=1
  // the woff2 files are refused, every glyph comes from the metric-matched
  // fallback, and this same diff must light up. It doubles as the measurement of
  // how close the fallback actually is.
  const blockFonts = process.env.RUN8_BLOCK_FONTS === '1';
  fs.mkdirSync(outdir, { recursive: true });
  const browser = await chromium.launch();
  const result = { tag, base, blockFonts, capturedPages: {}, unstable: [], fontState: {} };

  for (const url of PAGES) {
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
      });
      await ctx.addInitScript(freezeClock, FROZEN);
      const page = await ctx.newPage();
      if (blockFonts) await page.route('**/*.woff2', r => r.abort());
      await page.goto(`${base}${url}`, { waitUntil: 'load', timeout: 45000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1500);
      // Did the real face actually arrive? "It looks right" is not evidence.
      result.fontState[`${url}@${width}`] = await page.evaluate(() => ({
        sg: document.fonts.check('400 16px "Space Grotesk"'),
        jb: document.fonts.check('400 16px "JetBrains Mono"'),
        loaded: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight),
      }));
      const a = await page.evaluate(collect);
      await page.waitForTimeout(700);
      const b = await page.evaluate(collect);
      const stable = JSON.stringify(a.map(r => r.rects)) === JSON.stringify(b.map(r => r.rects));
      if (!stable) result.unstable.push(`${url}@${width}`);
      result.capturedPages[`${url}@${width}`] = b;
      console.log(`  ${tag.padEnd(6)} ${url.padEnd(26)} ${String(width).padStart(4)}px  ${b.length} text nodes  ${stable ? 'stable' : 'UNSTABLE'}`);
      await ctx.close();
    }
  }
  await browser.close();
  const out = path.join(outdir, `linemap-${tag}${blockFonts ? '-nofont' : ''}.json`);
  fs.writeFileSync(out, JSON.stringify(result, null, 1));
  console.log(`  wrote ${out}`);
  if (result.unstable.length) console.log('  UNSTABLE VIEWS: ' + result.unstable.join(', '));
}

function diff(beforeFile, afterFile) {
  const B = JSON.parse(fs.readFileSync(beforeFile, 'utf8'));
  const A = JSON.parse(fs.readFileSync(afterFile, 'utf8'));
  const keys = Object.keys(B.capturedPages);
  let totalNodes = 0, changed = [];

  for (const k of keys) {
    const bn = B.capturedPages[k] || [];
    const an = A.capturedPages[k] || [];
    const bi = new Map(bn.map(r => [r.path + '|' + r.textHead, r]));
    const ai = new Map(an.map(r => [r.path + '|' + r.textHead, r]));
    for (const [id, b] of bi) {
      const a = ai.get(id);
      totalNodes++;
      if (!a) { changed.push({ view: k, id, why: 'node missing in after' }); continue; }
      if (b.lineCount !== a.lineCount) {
        changed.push({ view: k, id, why: `line count ${b.lineCount} -> ${a.lineCount}`, b, a });
        continue;
      }
      // Same number of lines: did the words on each line move?
      if (b.lines && a.lines && JSON.stringify(b.lines) !== JSON.stringify(a.lines)) {
        changed.push({ view: k, id, why: 'same line count, different split', b, a });
        continue;
      }
      // Same split: did any line box change width by more than a rounding hair?
      const wDelta = b.rects.map((r, i) => Math.abs(r[2] - (a.rects[i] ? a.rects[i][2] : 0)));
      const worst = Math.max(...wDelta, 0);
      if (worst > 0.5) changed.push({ view: k, id, why: `line width delta ${worst.toFixed(2)}px`, b, a });
    }
    for (const [id] of ai) if (!bi.has(id)) changed.push({ view: k, id, why: 'node new in after' });
  }

  console.log('='.repeat(100));
  console.log(`LINE-BREAK DIFF — ${keys.length} page/viewport combinations, ${totalNodes} text nodes compared`);
  console.log('='.repeat(100));
  if (!changed.length) {
    console.log('  ZERO line-break changes.');
  } else {
    console.log(`  ${changed.length} CHANGED:`);
    for (const c of changed.slice(0, 40)) {
      console.log(`   X ${c.view}  ${c.why}`);
      console.log(`       ${c.id.slice(0, 120)}`);
      if (c.b && c.b.lines) console.log(`       before: ${JSON.stringify(c.b.lines).slice(0, 200)}`);
      if (c.a && c.a.lines) console.log(`       after : ${JSON.stringify(c.a.lines).slice(0, 200)}`);
    }
    if (changed.length > 40) console.log(`   ... ${changed.length - 40} more`);
  }
  // Name the artifact after BOTH inputs. A single linemap-diff.json gets silently
  // overwritten by the next comparison, and then the file on disk no longer says
  // which two builds it describes.
  const nm = f => path.basename(f, '.json').replace(/^linemap-/, '');
  const report = path.join(path.dirname(afterFile), `linemap-diff-${nm(beforeFile)}-vs-${nm(afterFile)}.json`);
  fs.writeFileSync(report, JSON.stringify({ views: keys.length, nodes: totalNodes, changed }, null, 1));
  console.log(`  wrote ${report}`);
  return changed.length;
}

(async () => {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'capture') await capture(rest[0], rest[1] || path.join(__dirname, '..', 'audits', 'run8'));
  else if (cmd === 'diff') diff(rest[0], rest[1]);
  else { console.log('usage: run8_linemap.js capture <before|after> [outdir] | diff <b.json> <a.json>'); process.exit(2); }
})();
