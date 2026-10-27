# Performance audit

Shouldn't Wouldn't 0.1.1, October 26, 2026. Every number below was measured; nothing was estimated.
Where a number is noisy, that is said next to it.

## Method

- **Tool:** [scripts/bench.mjs](scripts/bench.mjs), run as
  `node scripts/bench.mjs --config none --config original=.cache/baseline --config current=. --runs 10 --profile-runs 4 --probe-runs 2`.
  Tables are produced from its JSON by [scripts/bench-report.mjs](scripts/bench-report.mjs).
- **Configurations:**
  - `none`: the same browser with no extension (baseline).
  - `original`: commit `8b2b2ec`, built unchanged.
  - `current`: this working tree.
- **Browser:** Playwright's Chromium 156.0.8078.4 (Chrome for Testing), new headless mode, 1280×800,
  one persistent profile per configuration.
- **Machine:** Intel Core i7-6800K (6 cores, 3.4 GHz), 15.9 GB RAM, Windows 10 Home 19045, Node 25.8.
  The machine was also running other programs; no CPU throttling was applied.
- **Pages:** local fixtures served from `127.0.0.1` over HTTP (so the insecure-connection signal is
  active on every page; this is the heavier path for the extension).
- **Runs:** each configuration × page gets 10 timing runs, each in a fresh tab. Then 4 runs with the
  V8 CPU profiler attached (100 µs sampling) to attribute script time to the content script, and 2 runs
  with the test probe build to count observer callbacks and DOM queries. Medians are reported, with
  95th percentile and worst case where useful.
- **Metrics:**
  - *Added main-thread work:* Chrome's `TaskDuration` for the page (all main-thread tasks: parsing,
    script, style, layout, paint) minus the no-extension median. This is the most complete number and
    also the noisiest: run-to-run variation on this machine was tens of milliseconds, so small
    differences are not meaningful.
  - *Extension script time:* self time of samples whose script URL is the extension's content script.
    This is precise about the extension's own JavaScript (including the DOM calls it makes) but does
    not include style and layout work its DOM changes cause later.
  - *Time until the first reminder:* from navigation start to the first time a field receives the
    extension's mark, observed by a page-world `MutationObserver`.
  - *Long tasks / total blocking time:* from the Long Tasks API; the browser does not report every long
    task reliably in headless runs, so treat these as indicative.
  - *Keystroke to next frame:* for each `keydown`, the time until the next animation frame and a zero
    timeout, while typing at 20 ms per key.
  - *Scroll frame interval:* animation-frame spacing while scrolling with the mouse wheel.
  - *Route change to reminder:* in the React app, time from clicking a route button until the new
    route's sensitive field is marked.
  - *Heap:* `Runtime.getHeapUsage` after a forced garbage collection. Content scripts share the page's
    V8 heap, so this includes the extension.

## Results

Generated tables follow.
