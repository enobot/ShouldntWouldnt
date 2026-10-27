// Prints detection accuracy on the labeled cases in tests/accuracy-cases.ts (the tuning set) and
// tests/accuracy-holdout.ts (written after tuning, never tuned on).
//   node scripts/accuracy.mjs            uses this tree's build in dist/
//   node scripts/accuracy.mjs <dir>      uses another build's dist/src/shared/detect.js (for before/after)
// Run `npm test` or `npm run build` first so dist/ exists.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const buildRoot = resolve(process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : root);
const load = (path) => import(pathToFileURL(resolve(root, path)).href);
const { ACCURACY_CASES } = await load("dist/tests/accuracy-cases.js");
const { HOLDOUT_CASES } = await load("dist/tests/accuracy-holdout.js");
const { measure } = await load("dist/tests/accuracy-metrics.js");
const { classifyField } = await import(pathToFileURL(resolve(buildRoot, "dist/src/shared/detect.js")).href);

const pct = (n) => `${(n * 100).toFixed(1)}%`;
console.log(`Build: ${buildRoot}`);
for (const [title, cases] of [
  ["Tuning set", ACCURACY_CASES],
  ["Held-out set", HOLDOUT_CASES],
]) {
  const report = measure(cases, classifyField);
  console.log(`\n== ${title}: ${cases.length} cases (${report.scored} scored, ${report.ambiguous} ambiguous)`);
  console.log(`Correct (scored): ${report.correct}/${report.scored}`);
  console.log(`Category TP ${report.truePositives}  FP ${report.falsePositives}  FN ${report.falseNegatives}  TN ${report.trueNegatives}`);
  console.log(`Category precision ${pct(report.precision)}  recall ${pct(report.recall)}`);
  console.log(`Warn/no-warn precision ${pct(report.warnPrecision)}  recall ${pct(report.warnRecall)}`);
  console.log(`Ambiguous cases answered acceptably: ${report.ambiguousOk}/${report.ambiguous}`);
  console.log("By category (TP / FP / FN):");
  for (const [category, s] of Object.entries(report.byCategory).sort()) {
    console.log(`  ${category.padEnd(16)} ${s.truePositives} / ${s.falsePositives} / ${s.falseNegatives}`);
  }
  console.log("Cases that did not match:");
  for (const miss of report.misses) console.log(`  ${miss.id.padEnd(30)} expected ${miss.expected.padEnd(16)} got ${miss.predicted}`);
}
