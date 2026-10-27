// Repeatable page benchmark for the extension in Playwright's Chromium.
//
//   node scripts/bench.mjs --config none --config current=. --config original=<dir> --runs 10 --out .cache/bench/run.json
//
// "none" launches the same browser without an extension. Each other config is an unpacked
// extension directory that has already been built. Every run opens a fresh tab, so state does not
// carry between runs. Pages come from a local 127.0.0.1 server. Nothing is sent anywhere else.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { buildProbeExtension, launch, readProbe, ROOT, serve } from "../tests/browser/harness.mjs";

const args = process.argv.slice(2);
function option(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
}
const configs = [];
args.forEach((arg, index) => {
  if (arg !== "--config") return;
  const raw = args[index + 1];
  const [label, dir] = raw.includes("=") ? raw.split(/=(.*)/s) : [raw, null];
  configs.push({ label, dir: dir ? (isAbsolute(dir) ? dir : resolve(ROOT, dir)) : null });
});
if (configs.length === 0) configs.push({ label: "none", dir: null }, { label: "current", dir: ROOT });
const RUNS = Number(option("runs", "10"));
const PROFILE_RUNS = Number(option("profile-runs", "4"));
const PROBE_RUNS = Number(option("probe-runs", "2"));
const ONLY = option("only", "");
const OUT = resolve(ROOT, option("out", join(".cache", "bench", `bench-${Date.now()}.json`)));

const SYNTHETIC_TEXT = "the quick brown fox jumps over the lazy dog ".repeat(2).trim();

const SCENARIOS = [
  { id: "login", name: "Simple login form", path: "/fixtures/login.html", typing: [["input[name=username]", SYNTHETIC_TEXT]] },
  {
    id: "long-form",
    name: "Long registration form (60 fields)",
    path: "/fixtures/perf/long-registration.html",
    typing: [["input[name=hobbies]", SYNTHETIC_TEXT], ["input[name=ssn]", "900000001"]],
  },
  { id: "checkout", name: "Checkout page", path: "/fixtures/perf/checkout.html", typing: [["input[name=number]", "4111111111111111"]] },
  { id: "many-inputs", name: "600 inputs", path: "/fixtures/perf/many-inputs.html", typing: [["#field_1", SYNTHETIC_TEXT]] },
  { id: "large-dom", name: "~30,000 elements", path: "/fixtures/perf/large-dom.html", scroll: true },
  { id: "react", name: "React 18 SPA", path: "/fixtures/perf/react-app.html", react: true },
  { id: "churn", name: "Fields rewritten every 50 ms (5 s)", path: "/fixtures/perf/churn.html?seconds=5", doneAttr: "data-churn-done" },
  { id: "lazy", name: "Components loaded over 1 s (incl. shadow DOM)", path: "/fixtures/perf/lazy-components.html", doneAttr: "data-lazy-done" },
  { id: "hostile", name: "Hostile page deleting the note every frame (5 s)", path: "/fixtures/perf/hostile.html?seconds=5", doneAttr: "data-hostile-done" },
  { id: "tabs", name: "Five checkout tabs at once", path: "/fixtures/perf/checkout.html", tabs: 5 },
].filter((scenario) => !ONLY || ONLY.split(",").includes(scenario.id));

const INIT = `
  window.__bench = { firstMark: null, marks: 0, longTasks: [], keys: [], frames: [] };
  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i += 1) {
      if (records[i].attributeName === "data-shouldnt-wouldnt") {
        window.__bench.marks += 1;
        if (window.__bench.firstMark === null) window.__bench.firstMark = performance.now();
      }
    }
  }).observe(document, { attributes: true, attributeFilter: ["data-shouldnt-wouldnt"], subtree: true });
  try {
    new PerformanceObserver(function (list) {
      list.getEntries().forEach(function (entry) { window.__bench.longTasks.push(entry.duration); });
    }).observe({ type: "longtask", buffered: true });
  } catch (e) {}
  document.addEventListener("keydown", function (event) {
    var start = event.timeStamp;
    requestAnimationFrame(function () {
      setTimeout(function () { window.__bench.keys.push(performance.now() - start); }, 0);
    });
  }, true);
`;

function metricMap(result) {
  return Object.fromEntries(result.metrics.map((m) => [m.name, m.value]));
}

function quantile(values, q) {
  const sorted = values.filter((v) => typeof v === "number" && Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const pos = (sorted.length - 1) * q;
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (pos - lower);
}

function summarize(values) {
  const clean = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (clean.length === 0) return null;
  return { n: clean.length, median: quantile(clean, 0.5), p95: quantile(clean, 0.95), max: Math.max(...clean) };
}

async function settle(page, scenario) {
  if (scenario.doneAttr) {
    await page.waitForFunction((attr) => document.documentElement.hasAttribute(attr), scenario.doneAttr, { timeout: 30_000 });
    await page.waitForTimeout(400);
  } else {
    await page.waitForTimeout(1200);
  }
}

async function openAt(ctx, origin, scenario) {
  const page = await ctx.newPage();
  await page.goto(`${origin}/blank`);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Performance.enable", { timeDomain: "threadTicks" });
  return { page, cdp };
}

async function interact(page, scenario) {
  const out = {};
  if (scenario.typing) {
    await page.evaluate(() => {
      window.__bench.keys = [];
    });
    for (const [selector, text] of scenario.typing) {
      await page.click(selector);
      await page.keyboard.type(text, { delay: 20 });
    }
    await page.waitForTimeout(150);
    out.keys = await page.evaluate(() => window.__bench.keys);
  }
  if (scenario.scroll) {
    await page.evaluate(() => {
      window.__bench.frames = [];
      window.__bench.scrolling = true;
      let last = performance.now();
      const loop = (now) => {
        window.__bench.frames.push(now - last);
        last = now;
        if (window.__bench.scrolling) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    await page.mouse.move(640, 400);
    for (let i = 0; i < 40; i += 1) {
      await page.mouse.wheel(0, 240);
      await page.waitForTimeout(16);
    }
    await page.evaluate(() => {
      window.__bench.scrolling = false;
    });
    out.frames = (await page.evaluate(() => window.__bench.frames)).slice(2);
  }
  if (scenario.react) {
    const timings = {};
    for (const [button, field] of [
      ["#go-signup", "input[name=ssn]"],
      ["#go-checkout", "input[name=card]"],
    ]) {
      timings[button] = await page.evaluate(
        ({ button, field }) =>
          new Promise((done) => {
            const start = performance.now();
            const check = () => {
              const el = document.querySelector(field);
              if (el && el.hasAttribute("data-shouldnt-wouldnt")) {
                observer.disconnect();
                done(performance.now() - start);
              }
            };
            const observer = new MutationObserver(check);
            observer.observe(document, { subtree: true, attributes: true, childList: true });
            setTimeout(() => {
              observer.disconnect();
              done(null);
            }, 5000);
            document.querySelector(button).click();
          }),
        { button, field },
      );
    }
    await page.click("#go-signup");
    await page.waitForSelector("input[name=book]");
    await page.evaluate(() => {
      window.__bench.keys = [];
    });
    await page.click("input[name=book]");
    await page.keyboard.type(SYNTHETIC_TEXT, { delay: 20 });
    await page.click("input[name=ssn]");
    await page.keyboard.type("900000001", { delay: 20 });
    await page.waitForTimeout(150);
    out.keys = await page.evaluate(() => window.__bench.keys);
    out.routeToWarning = timings;
  }
  return out;
}

async function timingRun(ctx, origin, scenario) {
  if (scenario.tabs) {
    const opened = [];
    for (let i = 0; i < scenario.tabs; i += 1) opened.push(await openAt(ctx, origin, scenario));
    await Promise.all(opened.map(({ page }) => page.goto(`${origin}${scenario.path}`, { waitUntil: "load" })));
    await Promise.all(opened.map(({ page }) => settle(page, scenario)));
    let heap = 0;
    let task = 0;
    for (const { page, cdp } of opened) {
      await cdp.send("HeapProfiler.collectGarbage");
      heap += (await cdp.send("Runtime.getHeapUsage")).usedSize;
      task += metricMap(await cdp.send("Performance.getMetrics")).TaskDuration ?? 0;
      await page.close();
    }
    return { heapMb: heap / 1048576, taskMs: task * 1000 };
  }
  const { page, cdp } = await openAt(ctx, origin, scenario);
  await page.goto(`${origin}${scenario.path}`, { waitUntil: "load" });
  await settle(page, scenario);
  const metrics = metricMap(await cdp.send("Performance.getMetrics"));
  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType("navigation")[0];
    return { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd };
  });
  const bench = await page.evaluate(() => window.__bench);
  await cdp.send("HeapProfiler.collectGarbage");
  const heap = await cdp.send("Runtime.getHeapUsage");
  const interaction = await interact(page, scenario);
  await page.close();
  return {
    firstMarkMs: bench.firstMark,
    marks: bench.marks,
    loadMs: nav.load,
    dclMs: nav.dcl,
    taskMs: (metrics.TaskDuration ?? 0) * 1000,
    scriptMs: (metrics.ScriptDuration ?? 0) * 1000,
    layoutCount: metrics.LayoutCount,
    styleCount: metrics.RecalcStyleCount,
    layoutMs: (metrics.LayoutDuration ?? 0) * 1000,
    styleMs: (metrics.RecalcStyleDuration ?? 0) * 1000,
    nodes: metrics.Nodes,
    heapMb: heap.usedSize / 1048576,
    longTaskCount: bench.longTasks.length,
    tbtMs: bench.longTasks.reduce((sum, d) => sum + Math.max(0, d - 50), 0),
    keyMedianMs: quantile(interaction.keys ?? [], 0.5),
    keyP95Ms: quantile(interaction.keys ?? [], 0.95),
    keyMaxMs: interaction.keys?.length ? Math.max(...interaction.keys) : null,
    frameP95Ms: quantile(interaction.frames ?? [], 0.95),
    frameMaxMs: interaction.frames?.length ? Math.max(...interaction.frames) : null,
    routeSignupMs: interaction.routeToWarning?.["#go-signup"] ?? null,
    routeCheckoutMs: interaction.routeToWarning?.["#go-checkout"] ?? null,
  };
}

function scriptTime(profile, match) {
  const byId = new Map(profile.nodes.map((node) => [node.id, node]));
  let total = 0;
  for (let i = 0; i < profile.samples.length; i += 1) {
    const node = byId.get(profile.samples[i]);
    const delta = profile.timeDeltas[i + 1] ?? 0;
    if (node && match(node.callFrame.url)) total += delta;
  }
  return total / 1000;
}

async function profileRun(ctx, origin, scenario) {
  if (scenario.tabs) return null;
  const { page, cdp } = await openAt(ctx, origin, scenario);
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval: 100 });
  await cdp.send("Profiler.start");
  await page.goto(`${origin}${scenario.path}`, { waitUntil: "load" });
  await settle(page, scenario);
  const { profile } = await cdp.send("Profiler.stop");
  await page.close();
  return {
    extensionCpuMs: scriptTime(profile, (url) => url.startsWith("chrome-extension://")),
    pageCpuMs: scriptTime(profile, (url) => url.startsWith("http")),
  };
}

async function probeRun(ctx, origin, scenario) {
  if (scenario.tabs) return null;
  const page = await ctx.newPage();
  await page.goto(`${origin}${scenario.path}`, { waitUntil: "load" });
  await settle(page, scenario);
  const stats = await readProbe(page);
  await page.close();
  return {
    observerCallbacks: stats.mutationCallbacks,
    mutationRecords: stats.mutationRecords,
    shadowLookups: stats.shadowLookups,
    queryCalls: stats.queryCalls,
    elementsReturned: stats.queryResults,
    messages: stats.messages.length,
    violations: stats.violations.length,
  };
}

const { origin, close } = await serve({ "/blank": "<!doctype html><title>blank</title>" });
const report = {
  startedAt: new Date().toISOString(),
  runs: RUNS,
  profileRuns: PROFILE_RUNS,
  probeRuns: PROBE_RUNS,
  interleaved: true,
  configs: {},
};
// All configurations stay open and take turns run by run, so slow drift on the machine (other
// programs, thermal changes) affects every configuration alike instead of whichever ran last.
const browsers = [];
for (const config of configs) {
  const browser = await launch(config.dir);
  await browser.ctx.addInitScript(INIT);
  browsers.push({ config, browser });
  report.configs[config.label] = {};
}
for (const scenario of SCENARIOS) {
  for (const { config } of browsers) report.configs[config.label][scenario.id] = { name: scenario.name, timing: [], profiles: [] };
  for (let i = 0; i < RUNS; i += 1) {
    for (const { config, browser } of browsers) {
      report.configs[config.label][scenario.id].timing.push(await timingRun(browser.ctx, origin, scenario));
    }
  }
  for (let i = 0; i < PROFILE_RUNS; i += 1) {
    for (const { config, browser } of browsers) {
      if (!config.dir) continue;
      const profile = await profileRun(browser.ctx, origin, scenario);
      if (profile) report.configs[config.label][scenario.id].profiles.push(profile);
    }
  }
  process.stdout.write(`${scenario.id} done\n`);
}
for (const { browser } of browsers) await browser.close();
for (const config of configs) {
  if (!config.dir || PROBE_RUNS === 0) continue;
  const probeDir = buildProbeExtension(config.dir, `bench-${config.label}`);
  const probed = await launch(probeDir);
  for (const scenario of SCENARIOS) {
    const probes = [];
    for (let i = 0; i < PROBE_RUNS; i += 1) probes.push(await probeRun(probed.ctx, origin, scenario));
    report.configs[config.label][scenario.id].probes = probes.filter(Boolean);
  }
  await probed.close();
  process.stdout.write(`${config.label} probes done\n`);
}
close();

const summary = {};
for (const [label, results] of Object.entries(report.configs)) {
  summary[label] = {};
  for (const [id, result] of Object.entries(results)) {
    const fields = {};
    const keys = new Set(result.timing.flatMap((run) => Object.keys(run)));
    for (const key of keys) fields[key] = summarize(result.timing.map((run) => run[key]));
    for (const key of ["extensionCpuMs", "pageCpuMs"]) fields[key] = summarize(result.profiles.map((run) => run[key]));
    if (result.probes) {
      for (const key of Object.keys(result.probes[0] ?? {})) fields[key] = summarize(result.probes.map((run) => run[key]));
    }
    summary[label][id] = { name: result.name, ...fields };
  }
}
report.summary = summary;
report.environment = {
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  finishedAt: new Date().toISOString(),
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`BENCH_OK ${OUT}`);
