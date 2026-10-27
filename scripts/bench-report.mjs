// Turns a scripts/bench.mjs result file into Markdown tables.
//   node scripts/bench-report.mjs .cache/bench/final.json > .cache/bench/final.md
import { readFileSync } from "node:fs";

const report = JSON.parse(readFileSync(process.argv[2], "utf8"));
const configs = Object.keys(report.summary);
const scenarios = Object.keys(report.summary[configs[0]]);
const fmt = (value, digits = 1) => (value === null || value === undefined ? "—" : Number(value).toFixed(digits));
const stat = (config, scenario, key, which = "median") => report.summary[config]?.[scenario]?.[key]?.[which] ?? null;
const delta = (config, scenario, key) => {
  const base = stat("none", scenario, key);
  const value = stat(config, scenario, key);
  return base === null || value === null ? null : value - base;
};

console.log(`Runs per scenario: ${report.runs} timing, ${report.profileRuns} CPU-profile, ${report.probeRuns} probe.`);
console.log(`Started ${report.startedAt}, finished ${report.environment.finishedAt}, Node ${report.environment.node}, ${report.environment.platform}/${report.environment.arch}.\n`);

console.log("### Main-thread work added (median task time minus the no-extension median, ms)\n");
console.log(`| Page | No extension: task ms | ${configs.filter((c) => c !== "none").map((c) => `${c}: added task ms`).join(" | ")} |`);
console.log(`| --- | --- | ${configs.filter((c) => c !== "none").map(() => "---").join(" | ")} |`);
for (const id of scenarios) {
  const name = report.summary[configs[0]][id].name;
  const cells = configs.filter((c) => c !== "none").map((c) => fmt(delta(c, id, "taskMs")));
  console.log(`| ${name} | ${fmt(stat("none", id, "taskMs"))} | ${cells.join(" | ")} |`);
}

const extensionConfigs = configs.filter((c) => c !== "none");
console.log("\n### Extension script time (CPU profile, self time in the content script, ms)\n");
console.log(`| Page | ${extensionConfigs.map((c) => `${c} median / max`).join(" | ")} |`);
console.log(`| --- | ${extensionConfigs.map(() => "---").join(" | ")} |`);
for (const id of scenarios) {
  const name = report.summary[configs[0]][id].name;
  const cells = extensionConfigs.map((c) => `${fmt(stat(c, id, "extensionCpuMs"))} / ${fmt(stat(c, id, "extensionCpuMs", "max"))}`);
  console.log(`| ${name} | ${cells.join(" | ")} |`);
}

console.log("\n### Time until the first reminder (ms from navigation start)\n");
console.log(`| Page | ${extensionConfigs.map((c) => `${c} median / p95 / max`).join(" | ")} |`);
console.log(`| --- | ${extensionConfigs.map(() => "---").join(" | ")} |`);
for (const id of scenarios) {
  if (id === "tabs") continue;
  const name = report.summary[configs[0]][id].name;
  const cells = extensionConfigs.map(
    (c) => `${fmt(stat(c, id, "firstMarkMs"), 0)} / ${fmt(stat(c, id, "firstMarkMs", "p95"), 0)} / ${fmt(stat(c, id, "firstMarkMs", "max"), 0)}`,
  );
  console.log(`| ${name} | ${cells.join(" | ")} |`);
}

console.log("\n### Blocking, memory, layout\n");
console.log(`| Page | Config | Long tasks (median) | Total blocking ms (median / max) | JS heap MB (median) | Layouts (median) | Style recalcs (median) | Load event ms (median) |`);
console.log("| --- | --- | --- | --- | --- | --- | --- | --- |");
for (const id of scenarios) {
  const name = report.summary[configs[0]][id].name;
  for (const c of configs) {
    console.log(
      `| ${name} | ${c} | ${fmt(stat(c, id, "longTaskCount"), 0)} | ${fmt(stat(c, id, "tbtMs"), 0)} / ${fmt(stat(c, id, "tbtMs", "max"), 0)} | ${fmt(stat(c, id, "heapMb"), 2)} | ${fmt(stat(c, id, "layoutCount"), 0)} | ${fmt(stat(c, id, "styleCount"), 0)} | ${fmt(stat(c, id, "loadMs"), 0)} |`,
    );
  }
}

console.log("\n### Interaction\n");
console.log("| Page | Config | Keystroke to next frame ms (median / p95 / max) | Scroll frame interval ms (p95 / max) | Route change to reminder ms (sign-up / checkout) |");
console.log("| --- | --- | --- | --- | --- |");
for (const id of ["login", "long-form", "checkout", "many-inputs", "large-dom", "react"]) {
  if (!report.summary[configs[0]][id]) continue;
  const name = report.summary[configs[0]][id].name;
  for (const c of configs) {
    const keys = `${fmt(stat(c, id, "keyMedianMs"))} / ${fmt(stat(c, id, "keyP95Ms", "median"))} / ${fmt(stat(c, id, "keyMaxMs", "max"))}`;
    const frames = `${fmt(stat(c, id, "frameP95Ms"))} / ${fmt(stat(c, id, "frameMaxMs", "max"))}`;
    const route = `${fmt(stat(c, id, "routeSignupMs"), 0)} / ${fmt(stat(c, id, "routeCheckoutMs"), 0)}`;
    console.log(`| ${name} | ${c} | ${keys} | ${frames} | ${route} |`);
  }
}

console.log("\n### Work counted inside the extension (probe build, median of probe runs)\n");
console.log(`| Page | Config | Observer callbacks | Mutation records | Closed-root lookups | querySelectorAll calls | Elements returned | Messages sent | Privacy violations |`);
console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
for (const id of scenarios) {
  if (id === "tabs") continue;
  const name = report.summary[configs[0]][id].name;
  for (const c of extensionConfigs) {
    const s = (key) => fmt(stat(c, id, key), 0);
    console.log(
      `| ${name} | ${c} | ${s("observerCallbacks")} | ${s("mutationRecords")} | ${s("shadowLookups")} | ${s("queryCalls")} | ${s("elementsReturned")} | ${s("messages")} | ${s("violations")} |`,
    );
  }
}
