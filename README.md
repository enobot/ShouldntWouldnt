# Shouldn't Wouldn't

[![Tests](https://github.com/enobot/ShouldntWouldnt/actions/workflows/test.yml/badge.svg)](https://github.com/enobot/ShouldntWouldnt/actions/workflows/test.yml)

Think Twice Before You Share.

Shouldn't Wouldn't is a free Chrome extension for parents and other adults who are not software
specialists. When a web form appears to ask for something sensitive, such as a Social Security number,
card number, or password, it shows a short, calm note beside the field and can hide those characters on
screen as you type. It works entirely in the browser: it never reads what you type, stores one on/off
setting, and makes no network requests.

It is a teaching aid, not antivirus software. It does not block typing, and it never says a website is
safe, verified, or a scam.

## Status

- **Chrome Web Store:** version 0.1.1 was submitted on October 26, 2026 and is pending Google's review. It
  is not installable from the store yet; see [Load it in Chrome](#load-it-in-chrome). The submission
  record and what is still open are in [CHROME_WEB_STORE_CHECKLIST.md](CHROME_WEB_STORE_CHECKLIST.md).
- **Price:** free. No account, subscription, purchase, upgrade, or payment code.
- **Browsers:** Chrome 120 or newer on desktop. Other Chromium browsers may work but were not tested;
  Firefox and Safari are not supported. Labels are matched in English.
- **Repository name:** this repository was first named SurfSafe; GitHub redirects the old address.

## How it works

| Piece | What it does |
| --- | --- |
| **Reminders** | A content script on `http` and `https` pages classifies form fields from metadata only: control type, `name`, `id`, autocomplete token, placeholder, label, ARIA text, and a short clip of nearby description. Stronger wording covers Social Security, card, card security code, bank account, routing, government ID, passport, driver's license, password, and health fields; milder wording covers address, phone, email, and date of birth. Nearby text alone never triggers a note. |
| **Masking** | For Social Security, card, bank, routing, and ID numbers in ordinary text boxes, one CSS property (`-webkit-text-security`) draws dots instead of characters, with Show and Hide in the note. The value, type, autofill, validation, and submission are unchanged; only the screen changes. |
| **Site signals** | Three local checks can add a second note: the page loaded over HTTP, a warned field's form would submit over HTTP, or the hostname is a close lookalike of a well-known name. On submit the form pauses once with Go Back and Continue Anyway. There is no reputation lookup. |
| **Tamper fallback** | Notes live in closed shadow roots. If a page keeps removing or covering one, the extension puts it back at most five times in ten seconds, then marks its toolbar button with "!" for that tab. |
| **Popup** | An on/off switch, the site's hostname and connection scheme, two counts, and a plain status: No obvious risks, Caution recommended, Strongly indicated concern, or Unable to determine. |

```
web page (each http/https frame)
  └─ content script (dist/content.js): reads field metadata, shows notes, answers the popup
service worker: the only writer of the on/off setting; sets the toolbar "!" badge
popup: shows the page summary and the switch
```

Detection is rules, not a model, so it is explainable but misses labels that do not resemble the
patterns. How well it does on labeled examples, and why those numbers are not real-web rates, is in
[DETECTION_ACCURACY.md](DETECTION_ACCURACY.md).

## Privacy guarantees and how they are enforced

| Guarantee | Enforced by |
| --- | --- |
| Never reads what a person types: no `input.value`, `FormData`, input or keyboard listeners, clipboard, or text in editable areas | A source scan in the unit tests that fails on any of those APIs ([tests/privacy-scan.test.ts](tests/privacy-scan.test.ts)), and a runtime probe that wraps every value-reading API inside the content script's world in a real browser while synthetic values are typed, pasted, revealed, and submitted ([tests/browser/privacy.test.mjs](tests/browser/privacy.test.mjs), [probe-prelude.js](tests/browser/probe-prelude.js)) |
| Makes no network requests | The source scan forbids network APIs; the probe traps `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, and others; the browser tests serve every page locally and fail if any request leaves the fixtures |
| Stores one value: `protectionEnabled` (true or false) in `chrome.storage.local`, never synced | The scan allows no other storage API and no writes outside the service worker; a browser test reads extension storage and expects only that key |
| Pages cannot rewrite a note | Notes are built with `textContent` inside closed shadow roots; the scan forbids `innerHTML`, `insertAdjacentHTML`, `eval`, and similar |
| Messages carry no page data beyond a small summary | [src/shared/messages.ts](src/shared/messages.ts) accepts only exact key sets and types ([tests/messages.test.ts](tests/messages.test.ts)) |
| Minimal reach | Permissions are `storage` plus `http`/`https` host access. No `web_accessible_resources`, no `externally_connectable` (asserted by the scan), a strict extension CSP, and no remote code |

One limit, stated plainly: if a site copies what you typed into page text that a field points to as its
description (some error messages do), that text can be read when the field is looked at again. It is used
only for local word matching and is never kept or sent. Details are in
[SECURITY_AUDIT.md](SECURITY_AUDIT.md). The store privacy policy is
[store/privacy-policy.md](store/privacy-policy.md).

## Build and test

Requires Node.js 22 or newer.

| Command | What it does |
| --- | --- |
| `npm install` | Installs the development tools (TypeScript, Playwright, and React for one test page). The shipped extension has no third-party code |
| `npm test` | Typechecks and runs the unit tests: detection, labeled accuracy cases, copy, masking choice, site signals, messages, settings, store text, and the privacy source scan |
| `npm run build` | Compiles to `dist/`, bundles the content script into `dist/content.js`, and writes the icons |
| `npm run browsers` | Downloads Playwright's Chromium into `.cache/` (branded Chrome no longer accepts `--load-extension`) |
| `npm run test:browser` | Real-browser privacy, behavior, and release tests against the build. Run `npm run build` and `npm run package` first |
| `npm run accuracy` | Prints detection precision and recall on the labeled cases |
| `npm run package` | Writes the store upload, `release/shouldnt-wouldnt-<version>.zip`, with only the files the extension loads |
| `npm run store-assets` | Captures the store screenshots and promo tile into `store/assets/` from the built extension |
| `npm run bench` | Runs the page benchmark in [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) |

GitHub Actions ([.github/workflows/test.yml](.github/workflows/test.yml)) runs the unit tests, build,
package, and the real-browser tests on every push and pull request to `main`.

### Load it in Chrome

After `npm run build`, open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and
select the repository root (or the unzipped package from `npm run package`).

### Try the mock pages

Serve the repository over `http` (content scripts do not run on `file://` pages) and open
`http://127.0.0.1:8765/fixtures/`:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

The pages use fake labels only. `fixtures/perf/` holds the benchmark's stress pages.

## Reports

| Report | Covers |
| --- | --- |
| [SECURITY_AUDIT.md](SECURITY_AUDIT.md) | Data flow, findings and fixes, the privacy probe, hostile pages, permissions, remaining risks |
| [ACCESSIBILITY_AUDIT.md](ACCESSIBILITY_AUDIT.md) | Screen-reader names and descriptions, keyboard order, contrast, zoom, forced colors |
| [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) | Measured cost on stress pages against a no-extension baseline |
| [DETECTION_ACCURACY.md](DETECTION_ACCURACY.md) | Precision and recall on tuning and held-out cases, and their limits |
| [CHROME_WEB_STORE_CHECKLIST.md](CHROME_WEB_STORE_CHECKLIST.md) | Store requirements, permission justifications, data disclosures, submission record |
| [FEATURE_FEASIBILITY.md](FEATURE_FEASIBILITY.md) | Proposed features (email and merchant checks) that need separate approval |
| [store/](store/) | Listing text, privacy policy, terms, support, install steps, and the manual test list |

## Limits

- Fields in cross-origin frames that are not `http`/`https`, closed shadow roots on plain built-in
  elements, and custom-drawn text boxes are not seen.
- A bare "Account number" label warns as a bank account, which may be wrong.
- It cannot tell a legitimate request from a fraudulent one with the same form, cannot inspect
  certificates, and cannot promise a site is safe.
- A page can still cover, hide, or keep removing a note; the toolbar "!" is the fallback.
- Masking is visual only. Screen readers still read the real characters, and text areas, drop-downs, and
  custom controls are not masked.
- On server-rendered React sites that hydrate late, a note inserted before hydration makes React re-render
  that part of the page once. Forms keep working.
- After an extension update, tabs that were already open keep the old content script until they reload.

## Project layout

- `manifest.json`: Manifest V3.
- `src/background/service-worker.ts`: writes the on/off setting for the popup and sets the toolbar badge.
- `src/content/`: scanning, field metadata, placement, masking, repair, and the note UI.
- `src/popup/popup.ts`: the popup.
- `src/shared/`: detection, masking choice, copy, local site signals, message checks, the setting rule,
  and the privacy sentences.
- `tests/`: unit tests and labeled accuracy cases. `tests/browser/`: real-browser tests, the harness, and
  the privacy probe.
- `scripts/`: content-script bundler, icon writer, package builder, store image capture, accuracy report,
  benchmark, browser installer.
- `fixtures/`: local mock pages. `store/`: store text and policy. `store/assets/`: store images and the
  sample pages they are captured from.
