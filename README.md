# Shouldn't Wouldn't

[![Tests](https://github.com/enobot/ShouldntWouldnt/actions/workflows/test.yml/badge.svg)](https://github.com/enobot/ShouldntWouldnt/actions/workflows/test.yml)

Think Twice Before You Share.

## Overview

Shouldn't Wouldn't is a free Chrome extension that shows a short, calm note beside a web-form field
when the field appears to ask for something sensitive, such as a Social Security number, card number,
bank account, or the answer to a security question. For the most sensitive numbers it can also draw dots instead of the
characters while you type, so people nearby or on a screen share cannot read them.

I built it for parents and other adults who are not software specialists: people who would benefit
from a reminder to pause before sharing personal or financial information, without an alarm, a block,
or a verdict about the website. It is a teaching aid, not antivirus software. It never says a site is
safe, verified, or a scam.

Everything happens in the browser. The extension reads field labels, not what you type, stores two
settings (on/off and the language you chose), and makes no network requests.

**Status:** version 0.1.1 was submitted to the Chrome Web Store on October 26, 2026 and is pending
Google's review. It is not installable from the store yet. Version 0.1.3 will be uploaded when that review
finishes. It fixes a display bug found after submission (0.1.2), stops reminders for email, password,
and phone fields on ordinary HTTPS pages, adds maiden names, security answers, and license plates, and
keeps notes out of the page's own field boxes. This repository is at 0.2.0, which adds a choice of 12
languages; its translations are drafts that native speakers have not reviewed yet
([TRANSLATIONS.md](TRANSLATIONS.md)). The repository was first named SurfSafe;
GitHub redirects the old address.

## Features

Implemented (version 0.2.0 in this repository; 0.1.1 is the submitted version):

- **Field reminders.** A red outline and a note beside fields that appear to ask for a Social Security
  number, card number, card security code, bank account or routing number, government ID, passport,
  driver's license, license plate, maiden name, the answer to a security question, or health
  information. Address and date of birth get milder wording. Comment boxes, search boxes, and the
  drop-down that picks a security question stay quiet.
- **Email, password, and phone only when there is a reason.** These appear on nearly every sign-in page,
  so I decided they get a reminder only where the page gives a reason: it loaded over plain HTTP, its
  form would send over HTTP, or its address is a lookalike of a well-known name (a fake bank sign-in,
  for example). On an ordinary HTTPS page they stay quiet.
- **Placement.** A note goes on its own line below the field, outside the field's label and outside
  any box or row the page draws around the field, so it does not squeeze the field or cover the
  buttons below it.
- **Your language.** Right after install, a welcome page asks which language to use for the extension's
  own words: English, Español, 简体中文, 繁體中文, Tiếng Việt, Tagalog, 한국어, العربية, Français, Русский,
  Português, or Kreyòl ayisyen. Notes, explanations, buttons, the site warning, and the popup then
  appear in that language, laid out right to left for Arabic, and it can be changed from the popup at
  any time. The page being visited is never translated. Labels written in those languages are
  recognized too, so a Spanish "Número de Seguro Social" field gets a note. The translations and the
  label phrases are drafts that native speakers have not reviewed ([TRANSLATIONS.md](TRANSLATIONS.md)).
- **"Why am I seeing this?"** A plain explanation of what the field seems to ask for and why it
  matters. Each note can be dismissed for that page.
- **On-screen masking.** For Social Security, card, bank, routing, government ID, passport, and
  driver's license fields in ordinary text boxes, characters show as dots, with Show and Hide in the
  note. The value, field type, autofill, validation, and submission are unchanged.
- **Site notes.** A second note when the page loaded over HTTP, when a warned field's form would submit
  over HTTP, or when the hostname is a close lookalike of a well-known name. On submit, the form pauses
  with Go Back and Continue Anyway; Continue Anyway sends the form with the button that was pressed.
- **Tamper fallback.** If a page keeps removing or covering a note, the extension puts it back at most
  five times in ten seconds, then shows "!" on its toolbar button for that tab.
- **Popup.** An on/off switch, the site's hostname and connection scheme, counts of sensitive fields
  and site concerns, and one of four statuses: No obvious risks, Caution recommended, Strongly
  indicated concern, Unable to determine.
- **Saved setting.** Turning protection off stays off across pages, reloads, and browser restarts until
  you turn it back on.
- **Coverage of modern pages.** Fields added later, single-page apps, every `http`/`https` frame, open
  shadow roots, and closed shadow roots on custom elements.
- **Accessibility.** Screen readers hear the field's own label followed by the reminder as its
  description; all note controls are native buttons reachable by keyboard. Notes never take focus on
  their own; the one deliberate focus move is to the site note when a submit is paused.

Not implemented (proposals only, described in [FEATURE_FEASIBILITY.md](FEATURE_FEASIBILITY.md)):

- **Email sender and sensitive-request check** for Gmail. It would read message content, which changes
  the privacy model and may count as a second purpose under store policy. Not built.
- **Merchant check** that points to independent review sites before a card payment. Not built.

## Technologies

| Technology | Why |
| --- | --- |
| Chrome extension, Manifest V3 | The current Chrome extension format. A service worker, a content script, and a popup |
| TypeScript (strict) | Type checking across the content script, service worker, popup, and the shared message types they exchange |
| No runtime dependencies | The shipped package contains no third-party code, so everything that runs on a user's pages can be reviewed in this repository |
| A small bundler script ([scripts/bundle-content.mjs](scripts/bundle-content.mjs)) | Manifest V3 content scripts must be classic scripts, so the content script's modules are joined into one file. The service worker and popup stay ES modules |
| Node.js built-in test runner (`node --test`) | Unit tests with no test framework to install |
| Playwright with Chrome for Testing (Chromium) | Real-browser tests with the extension loaded. Branded Chrome no longer accepts `--load-extension` |
| React 18 | Development only, for two test pages that check compatibility with React-controlled inputs and server-rendered hydration |
| GitHub Actions | Runs the unit tests, build, package, and browser tests on every push and pull request to `main` |

## Architecture

```
+--------------------------------+   1. "send your summary"     +-------------+
| Content script                 | <----------------------------|    Popup    |
| (every http/https frame,       | ---------------------------->+-------------+
|  isolated world)               |   2. hostname, scheme,              |
|                                |      counts, status                 | "turn protection
| - reads field metadata only    |                                     |  on or off"
| - inserts notes inside closed  |                                     v
|   shadow roots                 |   "this page hid a note"     +----------------+
|                                | ---------------------------->| Service worker |
+--------------------------------+        (type only)           | only writer of |
     |                ^                                         | the setting;   |
     | reads once     | change                                  | sets "!" badge |
     | per page       | events                                  +----------------+
     v                |                                                 |
+--------------------------------+                                      | writes
| chrome.storage.local           | <------------------------------------+
| { protectionEnabled: boolean } |
+--------------------------------+
```

- The content script never reads field values. It classifies each field from its metadata with rules
  in [src/shared/detect.ts](src/shared/detect.ts), then inserts a note on its own line below the field,
  outside its label and outside any side-by-side row or fixed-size box around it.
- Notes are built with `textContent` inside closed shadow roots, with inline `!important` host styles,
  so page scripts cannot rewrite their words and page stylesheets cannot restyle them directly.
- The service worker is the only writer of the two saved settings (on/off, and the language), and
  only for a message from the extension's own `popup.html` or, for the language, `welcome.html`. The
  content script reads both in one storage read when a page loads and re-labels open notes when the
  language changes. The words for each language are in [src/shared/i18n/](src/shared/i18n/). Every message is checked against an exact shape in
  [src/shared/messages.ts](src/shared/messages.ts).
- Nothing is sent over the network by any part of the extension.

## Project structure

```
manifest.json            Manifest V3: permissions, content script, service worker, popup
popup.html, popup.css    the toolbar popup
content.css              outline and masking styles applied to page fields
src/content/             scanning, field metadata, placement, masking, repair, note UI
src/background/          service worker: the on/off setting and the toolbar badge
src/popup/               popup logic
src/welcome/             the language page shown right after install (welcome.html, welcome.css)
src/shared/              detection rules, masking choice, copy, site signals, message checks
src/shared/i18n/         the extension's words, one file per language
tests/                   unit tests and labeled accuracy cases
tests/browser/           real-browser tests, test harness, and the privacy probe
scripts/                 bundler, icon writer, package builder, store images, accuracy, benchmark
fixtures/                local mock pages with fake labels (fixtures/perf/: stress pages)
store/                   listing text, privacy policy, terms, support, manual test list
store/assets/            store screenshots, promo tile, and the sample pages they come from
.github/workflows/       CI
```

## Setup

Requires Node.js 22 or newer.

```bash
npm install
```

```bash
npm run build
```

`npm run build` compiles TypeScript into `dist/`, bundles the content script into `dist/content.js`,
and writes the icons. `dist/` is not committed.

## How to use

1. Build (above), or unzip the package from `npm run package`.
2. In Chrome, open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and select the
   repository root (or the unzipped package folder).
3. A welcome page opens and asks for your language. Pick one (you can change it later from the popup).
4. Pin Shouldn't Wouldn't from the puzzle-piece menu.
5. Open a page with a payment form. A note appears under fields such as the card number.
   (Email and password fields on an ordinary HTTPS page stay quiet.) Use Show, Why am I seeing this?, or Dismiss in the note.
6. Click the toolbar button to see the page summary, the language button, and the on/off switch.

To try the mock pages, serve the repository over `http` (content scripts do not run on `file://`
pages) and open `http://127.0.0.1:8765/fixtures/`:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

## Testing and validation

| Command | What it covers |
| --- | --- |
| `npm test` | Typecheck, then unit tests: detection rules, labeled accuracy cases, translations (every language complete), note wording, masking choice, site signals, message validation, the settings rule, store text, and the privacy source scan |
| `npm run browsers` | Downloads Playwright's Chromium into `.cache/` (needed once for the browser tests) |
| `npm run test:browser` | Real-browser tests against the build: detection on real pages, masking, accessibility names, site notes and paused submits, hostile pages, popup and settings, the privacy probe, and the release package. Run `npm run build` and `npm run package` first |
| `npm run accuracy` | Precision and recall of the detection rules on 206 tuning cases (42 of them in other languages) and 54 held-out cases |
| `npm run package` | Builds `release/shouldnt-wouldnt-<version>.zip` and refuses to include tests, TypeScript sources, or source maps |
| `npm run bench` | Page benchmark against a no-extension baseline ([PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md)) |

**Latest local run**, October 26, 2026, on a clean clone of commit `cd9b6f3` (version 0.2.0), Windows 10, Node.js 25.8.0,
Playwright 1.64.1 (Chromium 156):

| Check | Result |
| --- | --- |
| `npm ci` | 0 vulnerabilities reported |
| `npm test` | 50 of 50 tests passed (16 suites) |
| `npm run build`, `npm run package` | Succeeded; package of 31 files |
| `npm run test:browser` | 38 of 38 tests passed (9 suites) |
| `npm run accuracy` | Tuning set 196 of 196 scored cases correct (42 in other languages); held-out set 43 of 43 |

**CI:** GitHub Actions runs [.github/workflows/test.yml](.github/workflows/test.yml) on every push and
pull request to `main`, on Ubuntu with Node.js 22. Its first five runs, on October 26, 2026, all passed
both jobs (typecheck, unit tests, build, and package; and the real-browser tests in Playwright's
Chromium), including [run 40441430099](https://github.com/enobot/ShouldntWouldnt/actions/runs/40441430099)
on commit `3119545` (version 0.1.3). The browser tests took 30 to 40 seconds each time; installing
Chromium and its system packages took from under a minute to about seven, so each job has a time limit.
Five runs are not enough to know how often the browser tests flake on a hosted runner. The badge at the
top shows the latest run.

What these results do not show:

- The accuracy cases were written by the same person who wrote the rules, and the held-out set was
  adjusted after its first measurement (41 of 43). The 13 cases for maiden names, security answers, and
  license plates were written together with those rules in 0.1.3, and the 42 cases in other languages
  with the 0.2.0 phrase lists. They are not real-web error rates.
  [DETECTION_ACCURACY.md](DETECTION_ACCURACY.md) explains the method and its limits.
- No screen reader was run. Accessibility is checked through Chrome's accessibility tree and keyboard
  input.
- Real password managers, Chrome's own autofill menus, Vue and Angular apps, and the toolbar popup in
  branded Chrome are not covered by automation. The remaining hand checks are in
  [store/manual-tests.md](store/manual-tests.md).
- [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) describes the benchmark method, but its results tables
  were not generated into the report, so I make no performance claims here.

## Security and privacy

**What the extension promises, and how each promise is checked:**

| Promise | How it is enforced |
| --- | --- |
| It never reads what a person types: no `input.value`, `FormData`, input or keyboard listeners, clipboard, or text inside editable areas | A source scan in the unit tests fails on those APIs ([tests/privacy-scan.test.ts](tests/privacy-scan.test.ts)). A runtime probe ([tests/browser/probe-prelude.js](tests/browser/probe-prelude.js)) wraps every value-reading API inside the content script's world in a real browser while synthetic values are typed, pasted, revealed, and submitted, and the test expects zero reads ([tests/browser/privacy.test.mjs](tests/browser/privacy.test.mjs)) |
| It makes no network requests | The scan forbids network APIs; the probe traps `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, and others; the browser tests serve every page locally and fail if any request leaves the fixtures |
| It stores two values | `protectionEnabled` (true or false) and `language` (a language code or `auto`) in `chrome.storage.local`, never synced. The scan allows no other storage, one write in the whole extension, and only those two keys; a browser test reads extension storage and expects nothing else |
| Pages cannot rewrite a note | `textContent` only, inside closed shadow roots; the scan forbids `innerHTML`, `insertAdjacentHTML`, `eval`, and similar |
| Messages carry nothing typed | Exact key sets and types, plus a deny-list of keys such as `value` and `password` ([tests/messages.test.ts](tests/messages.test.ts)) |

**Permissions and Manifest V3.** The manifest asks for `storage` and host access to `http://*/*` and
`https://*/*`. I kept broad host access on purpose: a reminder is only useful if it appears before
someone types, on whatever site they are on. `activeTab` would only work after a click on the toolbar
button, and a list of sites cannot cover every form that asks for a Social Security number. The Chrome
Web Store flagged this for a longer review, which I accepted. There is no `tabs`, `scripting`,
`cookies`, `history`, or `webRequest` permission, no `web_accessible_resources`, no
`externally_connectable` (both asserted by a test), a strict extension-page CSP, and no remote code. The
content script runs in every frame (`all_frames`, `match_about_blank`, `match_origin_as_fallback`) so
that checkout and sign-in forms inside frames are covered.

**Limits, stated plainly:**

- If a site copies what you typed into page text that a field points to as its description (some error
  messages do), that text can be read when the field is looked at again. It is used only for local word
  matching and is never kept or sent.
- The probe covers the APIs listed in [SECURITY_AUDIT.md](SECURITY_AUDIT.md) in the content script's
  world. It cannot prove that no other path exists, and it does not instrument the service worker.
- Broad host access means a bug in the content script would run on every site.
- A hostile page can cover, hide, or keep removing a note, detect that the extension is installed, or
  draw a fake note of its own.
- Masking is not encryption. The website still receives what you enter, page scripts can still read the
  field, and screen readers still read the real characters.
- The extension cannot tell a legitimate request from a fraudulent one with the same form.
- Pausing a submit stops only the form's native submission. A page's own submit script can still send
  data.

The full review, with findings, fixes, and remaining risks, is in [SECURITY_AUDIT.md](SECURITY_AUDIT.md).
The store privacy policy is [store/privacy-policy.md](store/privacy-policy.md).

## Technical challenges and lessons learned

Each item below is documented in the audit reports with the fix and its regression test.

- **A static scan was not enough to prove "never reads typed values."** It missed
  `getAttribute("value")`, `innerText`, and clipboard APIs. A runtime probe in a real browser then found
  that text typed into rich-text (`contenteditable`) areas next to a field was being read as label text.
  The label reader now skips editable regions, drop-down options, and form controls (SECURITY_AUDIT
  SW-01, SW-17).
- **Inserting the note inside the field's `<label>` broke screen readers.** Chrome computed the field's
  name as the label plus the whole note. Notes now go after the label when the label is in normal flow,
  and the reminder is attached as the field's description (SW-03).
- **A paused submit looked like a broken button.** The site note was inserted at the top of the page, out
  of view on long pages, and Continue Anyway dropped which submit button had been pressed. The note now
  sits next to the field, scrolls into view with focus, and the original button is resent (SW-04,
  SW-05).
- **Large pages.** Looking for closed shadow roots asked Chrome about every element: 32,520 calls on the
  30,000-element test page. The lookup now runs only on custom elements, and site checks run once per
  batch instead of once per field (SW-08).
- **Notes landed inside the page's own field boxes.** On a real sign-up page (Shopify), I saw a note
  placed right after the input end up inside the page's fixed-height flex row, squeeze the input, and
  spill over the Continue button. Notes now move out of labels and side-by-side rows, and a note that
  still spills out of its box moves after it (0.1.3).
- **Too many notes.** On another real sign-up page (Apple), every email, password, and phone field got a
  full note, including the phone country-code drop-down. That made the reminders easy to ignore, so
  email, password, and phone now wait for a reason on the page, and drop-downs never get them (0.1.3).
- **False alarms.** Sign-in codes were taken for card security codes, library and loyalty cards for
  payment cards, and country sites such as `amazon.com.au` for lookalikes. Rules were tightened and
  measured against a separate held-out set (SW-10, SW-11, [DETECTION_ACCURACY.md](DETECTION_ACCURACY.md)).

## Limitations and future improvements

Known limitations:

- **Known bug in the submitted 0.1.1, fixed in 0.1.2 and later:** notes for fields that are not masked (password,
  email, phone, address, date of birth, card security code, health) show an empty bordered button where
  Show goes, which is also an extra keyboard stop. The note's button style overrode the `hidden`
  attribute. It was found after submission, during zoom and high-contrast checks. The fix is not in the
  store until the 0.1.1 review finishes.
- Rules, not a model: labels that do not resemble the patterns are missed. Labels are recognized in
  English and, through drafted phrase lists, in the 11 other languages above; other languages are not.
- The translations are drafts that native speakers have not reviewed.
- The content script carries every language, so it grew from about 77 KB to about 235 KB. Only the
  language in use is built in memory.
- Fields in cross-origin frames that are not `http`/`https`, closed shadow roots on built-in elements,
  and custom-drawn text boxes are not seen.
- A bare "Account number" warns as a bank account, which may be wrong.
- Note text is a fixed 14 px, so Chrome's font-size setting does not enlarge it; browser zoom does.
- On server-rendered React sites that hydrate late, a note inserted before hydration makes React
  re-render that part of the page once. Forms keep working.
- After an extension update, tabs that were already open keep the old content script until they reload.

Future work:

- Upload 0.1.3 once the 0.1.1 review finishes.
- A native-speaker review of every translation and of the label phrases ([TRANSLATIONS.md](TRANSLATIONS.md)).
- A screen-reader pass with NVDA or VoiceOver, and the other hand checks in
  [store/manual-tests.md](store/manual-tests.md).
- Generate the benchmark results into [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md).
- The email and merchant checks above, only after the privacy and permission changes in
  [FEATURE_FEASIBILITY.md](FEATURE_FEASIBILITY.md) are decided.

More detail: [SECURITY_AUDIT.md](SECURITY_AUDIT.md), [ACCESSIBILITY_AUDIT.md](ACCESSIBILITY_AUDIT.md),
[DETECTION_ACCURACY.md](DETECTION_ACCURACY.md), [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md),
[CHROME_WEB_STORE_CHECKLIST.md](CHROME_WEB_STORE_CHECKLIST.md).

## Development transparency

I designed and architected this project, including its concept, features, user experience, and
technical direction. I used AI-assisted development tools to support parts of the implementation,
debugging, testing, documentation, and the security, accessibility, and performance reviews in this
repository. I reviewed and evaluated the suggestions, and I remain responsible for the project's design
decisions, functionality, and known limitations. Passing tests and tool-assisted reviews do not
guarantee correctness or security; the limits above still apply.

## Author

Tracy Tran, computer science student at California State University, Fullerton (CSUF), graduating May
2027. https://www.tracythutran.com
