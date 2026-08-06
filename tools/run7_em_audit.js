/* AIC RUN 7 · "one cyan-italic phrase per section MAX" — counted, not assumed.
 * On these pages <em> is the cyan italic; there is no other italic on the site.
 *   node tools/run7_em_audit.js
 */
const fs = require('fs');
const path = require('path');
const CH = path.join(__dirname, '..', 'chauffeur');
const PAGES = ['index.html', 'demo/index.html', 'book/index.html', 'how-setup-works/index.html',
  'works-with-your-software/index.html', 'limo-answering-service/index.html',
  'after-hours-limo-dispatch/index.html', 'airport-transfer-booking/index.html',
  'milwaukee-limo-answering-service/index.html', 'madison-limo-answering-service/index.html',
  'privacy/index.html', 'terms/index.html'];

let bad = 0;
for (const rel of PAGES) {
  const s = fs.readFileSync(path.join(CH, rel.replace(/\//g, path.sep)), 'utf8');
  const chunks = s.split(/<section\b/).slice(1);
  const over = [];
  chunks.forEach(p => {
    const head = p.split('>')[0];
    const id = (head.match(/id="([^"]+)"/) || [])[1]
      || (head.match(/class="([^" ]+)/) || [])[1] || '?';
    const body = p.split('</section>')[0];
    const n = (body.match(/<em>/g) || []).length;
    if (n > 1) { over.push(id + ' x' + n); bad++; }
  });
  const foot = (s.split('<footer')[1] || '').split('</footer>')[0];
  const fn = (foot.match(/<em>/g) || []).length;
  if (fn > 1) { over.push('footer x' + fn); bad++; }
  console.log('  ' + rel.padEnd(42) + (over.length ? 'OVER: ' + over.join(', ') : 'ok — max 1 per section'));
}
console.log('\n  ' + (bad ? bad + ' section(s) carry more than one cyan italic' : 'no section carries more than one cyan italic'));
process.exit(bad ? 1 : 0);
