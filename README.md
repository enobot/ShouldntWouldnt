# Shouldn't Wouldn't

Think Twice Before You Share.

Shouldn't Wouldn't is a free Chrome extension for parents and other adults who are not software specialists. It shows a short, calm reminder when a web form appears to ask for sensitive information, and it can hide those characters on screen as you type them. It is a teaching aid. It is not antivirus software, it does not block typing, and it does not decide that a website is safe or malicious.

The GitHub repository is `enobot/ShouldntWouldnt`. It was first named SurfSafe, and older clones may still point at that address, which GitHub redirects. The product name is Shouldn't Wouldn't.

Version 0.1.1 was submitted to the Chrome Web Store on October 26, 2026 and is pending Google's review. It has not been approved or published yet. Store text, the privacy policy, and the terms are in `store/`. The submission record and what is still open are in [CHROME_WEB_STORE_CHECKLIST.md](CHROME_WEB_STORE_CHECKLIST.md).

The extension is completely free. There is no account, subscription, purchase, license key, upgrade, or paid tier, and no payment code.

## What it does

**Reminders.** On ordinary `http` and `https` pages, a content script looks at form fields using metadata only: the control type, `name`, `id`, autocomplete token, placeholder, label, ARIA text, and a short clip of nearby description. It never reads what a person types, and it skips the text of form controls, drop-down options, and editable areas when it reads labels.

High-sensitivity reminders cover Social Security numbers, card numbers, card security codes, bank account numbers, routing numbers, government IDs, passports, driver's licenses, passwords, and health or medical fields. Milder reminders cover street address, phone, email, and date of birth. Comment boxes, search boxes, and drop-down lists asking yes/no questions stay quiet, and nearby text by itself is never enough to warn. Sign-in codes ("enter the code we sent you") are not mistaken for card security codes.

A thin red outline and a short note appear beside a matching field: "This website appears to be asking for your Social Security number. Only share this information with organizations you trust." The note can be dismissed for that field until the page closes. "Why am I seeing this?" explains the kind of information and says the extension does not read typing. Screen readers hear the field's own label, followed by the reminder as its description.

**Masking.** For Social Security, card, bank account, routing, government ID, passport, and driver's license fields that are ordinary text boxes, the characters show as dots while you type. An eye button in the note says Show, and then Hide. This uses one CSS property on the field (`-webkit-text-security`). The field's value, type, autofill, validation, and submission are unchanged, and the extension never reads the value. It only changes what the screen shows; the website still receives what you enter. Passwords already hide; text areas, drop-downs, and email or search boxes are not masked.

**Site signals.** Three local signals can add a second note. They are not reputation lookups:

- The page itself was loaded over HTTP.
- A form that has a warned field has an `action` that resolves to HTTP.
- The hostname is a conservative lookalike: mixed Latin and Cyrillic or Greek in one label, a confusable brand spelling, a hyphenated brand plus a suspicious word, or a brand name embedded before an extra `.com`, `.net`, `.org`, or `.gov`. Country sites such as `amazon.com.au` are not flagged. Many real phishing names are missed on purpose.

The site note appears right after the warned field's note when that field is focused, or when its form is submitted, and only if one of those concerns is present. On submit, the form pauses, the note scrolls into view, and keyboard focus moves to it. Go Back returns focus to the button and does not clear the form. Continue Anyway sends the form with the button that was pressed. The extension does not stop a page's own submit scripts, and it never says a site is a scam, verified, or legitimate. HTTPS only means the page loaded as `https`.

**Hidden reminders.** If a page keeps deleting a note (more than five times in ten seconds) or covers it, the toolbar button shows "!" for that tab and the popup says the page removed or covered a reminder. The page cannot reach the toolbar. The mark clears when the page goes away.

**Popup.** The product name, an on/off switch, the site hostname, the connection scheme (`http`, `https`, or `other`), counts, and one of four statuses: "No obvious risks", "Caution recommended", "Strongly indicated concern", or "Unable to determine". When protection is off, the counts are hidden and the status is "Unable to determine". The popup always describes the page itself, not an embedded frame.

## Privacy rules this code follows

- Analysis stays in the browser. There is no backend, account, analytics, ad, telemetry, error report, or payment check. The extension makes no network requests.
- The extension does not read, log, store, transmit, or sell typed input. It does not read `input.value`, `FormData`, input or keyboard events, the clipboard, or text typed into editable areas. A source scan and a runtime probe in a real browser enforce this; see [SECURITY_AUDIT.md](SECURITY_AUDIT.md).
- The only saved setting is whether protection is on: a boolean in `chrome.storage.local` under `protectionEnabled`. It is not synced. `localStorage`, `sessionStorage`, and IndexedDB are not used.
- Dismissals, Show/Hide choices, and site-note answers live in memory for that page only.
- Turning protection off stays off across navigation, refresh, a service-worker restart, and a browser restart, until the person turns it back on. A new install with no saved choice starts on.
- Messages are small and checked. The popup summary is the hostname, the scheme, two counts, a status, whether protection is on, and whether the page hid a reminder. The hidden-reminder notice to the background script carries nothing but its type.
- One honest limit: if a site writes what you typed into page text that a field points to as its description (some error messages do), that page text may be read when the field is looked at again. It is used only for local word matching and never kept or sent.
- No website-reputation lookup is included. Email checks and merchant checks are proposals that need separate approval; see [FEATURE_FEASIBILITY.md](FEATURE_FEASIBILITY.md).

## How the pieces talk

The service worker is the only writer of the on/off boolean, and only for a message from the extension's own `popup.html`. After a save it tells open tabs. Content scripts read the boolean straight from `chrome.storage.local` when a page loads (so the worker is not woken for every page) and listen for storage changes.

Each matching frame runs the content script. It scans fields, watches for changes in batches every 150 ms, and answers the popup with a summary of that frame. Open shadow roots are scanned everywhere; closed shadow roots are scanned on custom elements through `chrome.dom.openOrClosedShadowRoot`. A cross-origin frame gets its own content script only when its own address is `http` or `https`. Browser pages such as `chrome://` and the Chrome Web Store are outside the match patterns, so the popup says "Unable to determine".

Notes live in closed shadow roots and use `textContent`, so the page cannot rewrite them. A note goes after the field's label when the label sits in normal block flow, and inside the label when it is one item of a flex or grid row. If a page removes a note or changes its style, the content script puts it back at most five times in ten seconds, then marks the toolbar button. Notes are in normal document flow, never a blocking overlay.

## Build, test, and load

Requires Node.js 22 or newer.

```bash
npm install
npm test
npm run build
```

`npm test` typechecks and runs the unit tests (detection, accuracy on labeled cases, copy, masking choice, signals, messages, settings rules, store text, and a source scan that fails if values are read or data is sent). `npm run build` bundles the content script into `dist/content.js` (Manifest V3 content scripts are classic scripts) and writes the icons. The service worker and popup stay ES modules. `dist/` is gitignored.

In Chrome, open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and select this repository root.

Real-browser tests and measurements use Playwright's Chromium (branded Chrome no longer accepts `--load-extension`). The browser goes in `.cache/`, which is gitignored:

```bash
npm run browsers
```

```bash
npm run test:browser
```

```bash
npm run accuracy
```

`npm run package` writes the store upload to `release/shouldnt-wouldnt-<version>.zip` (gitignored). It packages only the files the extension loads, follows the service worker's and popup's imports so unused modules stay out, and refuses to package tests, TypeScript sources, or source maps. `npm run store-assets` captures the store screenshots and small promo tile into `store/assets/` from the built extension. `npm run bench` runs the page benchmark described in [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md). The browser tests run against `npm run build` output, so build first; `release.test.mjs` also needs `npm run package`.

## Mock pages

Open the fixtures over `http`, not as `file://` files.

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8765/fixtures/`. The pages use fake labels only: login, registration, payment, email and phone, comments, Social Security number, card, bank, password, several fields, a field added later, a redrawn form, CSS that tries to hide the note, an HTTP form action, misleading labels, misleading page text, a suspicious-looking hostname, masking, validation with two submit buttons, a long page, a covered note, and a page with a frame. `fixtures/perf/` holds the stress pages used by the benchmark (a 60-field form, a checkout, 600 inputs, about 30,000 elements, a React app, constant field churn, late-loading components with shadow DOM, and a hostile page). The React page needs the repository's `node_modules` to be served from the same root.

## Supported environments

- Chrome 120 or newer on desktop (Windows, macOS, Linux, ChromeOS). Automated tests run in Chromium 156 (Chrome for Testing) on Windows.
- Other Chromium browsers may work but were not tested. Firefox and Safari are not supported.
- English labels.

## Limits

- Rules, not a model. Explainable and local, but labels that do not resemble the patterns are missed. See [DETECTION_ACCURACY.md](DETECTION_ACCURACY.md).
- Fields inside cross-origin frames that are not http/https, closed shadow roots on plain built-in elements, and custom-drawn text boxes are not seen.
- A label of "Account number" warns as a bank account, which may be wrong.
- The extension cannot tell a legitimate request from a fraudulent one with the same form, cannot inspect certificates, and cannot promise a site is safe.
- A page can cover a reminder, hide it through a parent element, or keep removing it. Repairs are capped so the page cannot trap the extension in a loop; the toolbar "!" is the fallback.
- Masking is visual only and is not applied to text areas, drop-downs, or custom controls. Screen readers still read the real characters.
- On server-rendered React sites that hydrate late, inserting a note before hydration makes React re-render that part of the page once. Forms keep working. See [SECURITY_AUDIT.md](SECURITY_AUDIT.md).
- After an extension update, tabs that were already open keep the old content script until they reload.
- The store listing is pending Google's review, so the extension cannot be installed from the Chrome Web Store yet.

## Project layout

- `manifest.json`: Manifest V3. Permissions are `storage` plus host access for `http` and `https`.
- `src/background/service-worker.ts`: writes the on/off boolean for the popup and sets the toolbar badge.
- `src/content/`: scanning, field metadata, placement, masking, repair, and the note UI.
- `src/popup/popup.ts`: the popup.
- `src/shared/`: detection, masking choice, copy, local site signals, message checks, the setting rule, and the privacy sentences.
- `tests/`: unit tests and the labeled accuracy cases. `tests/browser/`: real-browser privacy, behavior, and release tests, the test harness, and the probe.
- `scripts/`: content-script bundler, icon writer, package builder, store image capture, accuracy report, benchmark, browser installer.
- `fixtures/`: local mock pages.
- `store/`: listing, privacy policy, terms, install, support, and manual checks. `store/assets/`: the store screenshots, the small promo tile, and the sample pages they are captured from.
- Audit reports: [SECURITY_AUDIT.md](SECURITY_AUDIT.md), [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md), [DETECTION_ACCURACY.md](DETECTION_ACCURACY.md), [ACCESSIBILITY_AUDIT.md](ACCESSIBILITY_AUDIT.md), [CHROME_WEB_STORE_CHECKLIST.md](CHROME_WEB_STORE_CHECKLIST.md), [FEATURE_FEASIBILITY.md](FEATURE_FEASIBILITY.md).
