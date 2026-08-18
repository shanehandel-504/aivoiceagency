import { loadJSON } from './_lib.mjs';
const D = 'config-snapshots/2026-08-18-ava-seal/_context';
const which = process.argv[2], names = process.argv.slice(3);
const w = loadJSON(`${D}/${which}.json`);
for (const n of w.nodes) {
  if (names.length && !names.some(x => n.name.toLowerCase().includes(x.toLowerCase()))) continue;
  console.log('\n' + '='.repeat(70));
  console.log(`${n.name}   [${n.type}]  onError=${n.onError ?? '(default)'} alwaysOutputData=${n.alwaysOutputData ?? false} continueOnFail=${n.continueOnFail ?? false}`);
  console.log(JSON.stringify(n.parameters, null, 2));
}
