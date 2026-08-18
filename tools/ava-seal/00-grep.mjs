/* Locate every occurrence of a phrase inside a saved workflow JSON. */
import { loadJSON } from './_lib.mjs';
const [, , file, phrase] = process.argv;
const w = loadJSON(file);
for (const key of ['nodes', 'pinData', 'staticData', 'meta', 'connections', 'name', 'description']) {
  const s = JSON.stringify(w[key] ?? null);
  const c = (s.match(new RegExp(phrase, 'g')) || []).length;
  if (c) console.log(`${key} -> ${c} occurrence(s)`);
}
for (const n of w.nodes) {
  const s = JSON.stringify(n);
  let i = -1;
  while ((i = s.indexOf(phrase, i + 1)) !== -1) {
    console.log(`\n  [${n.name}]  …${s.slice(Math.max(0, i - 80), i + 40)}…`);
  }
}
