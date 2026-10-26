# Shouldn't Wouldn't

Think Twice Before You Share.

Shouldn't Wouldn't is a free Chrome extension for parents and other adults who are not software specialists. It shows a short, calm reminder when a page looks like it is asking for sensitive information. It is a teaching aid. It is not antivirus software, it does not block typing, and it does not decide that a website is safe or malicious.

The git repository is still named SurfSafe. That remote name is intentional. The product name is Shouldn't Wouldn't.

Version 0.1.1 has not been submitted to the Chrome Web Store and has not been reviewed by Google. Store text, the privacy policy, and the terms are in `store/`. The submission steps that still need a person are in `store/submission-checklist.md`.

The extension is completely free. Every reminder, explanation, and popup status is available to every person who installs it. There is no account, subscription, purchase, license key, upgrade, or paid tier. No payment code is included.

## What it does

On ordinary `http` and `https` pages, a content script looks at form fields. It uses metadata only: the control type, `name`, `id`, autocomplete token, placeholder, label, ARIA text, and a short clip of nearby descriptive text. It never reads what a person types.

High-sensitivity reminders cover Social Security numbers, card numbers, card security codes, bank account numbers, routing numbers, government IDs, passports, driver's licenses, and passwords. Milder reminders cover street address, phone, email, and date of birth. Health or medical fields use the stronger wording, with the context-tier confidence bar. Ordinary fields, including comment boxes and search boxes, stay quiet. Nearby text by itself is not enough to warn.

A thin red mark and a short note appear beside a matching field. The note can be dismissed for that field until the page closes. "Why am I seeing this?" explains the kind of information and what to do, and it says the extension does not read typing.

Three local site signals can add an extra reminder. They are not reputation lookups:

- The page itself was loaded over HTTP.
- A form that already has a warned field has an `action` that resolves to HTTP.
- The hostname is a conservative lookalike: mixed Latin and Cyrillic or Greek in one label, a confusable brand spelling, a hyphenated brand plus a suspicious word, or a brand name embedded before an extra `.com`, `.net`, `.org`, or `.gov`. Many real phishing names are missed on purpose, including names that merely contain a brand.

The stronger site panel appears only when a warned field is focused, or when a form that contains one is submitted, and only if one of those extra concerns is present. Go Back hides the panel and does not navigate away or clear the form. Continue Anyway continues the submit. More Information explains the concern and does not acknowledge it. The extension does not stop the page's own submit handlers, and it does not claim the site is a scam, verified, or legitimate. HTTPS only means the page loaded as `https`.

The popup shows the product name, an on/off control, the site hostname, the connection scheme (`http`, `https`, or `other`), counts, and one of four statuses: "No obvious risks", "Caution recommended", "Strongly indicated concern", or "Unable to determine". It also shows the privacy sentences that match this behavior. When protection is off, the counts are hidden and the status is "Unable to determine".

## Privacy rules this code follows

- Analysis stays in the browser. There is no backend, account, analytics, ad, telemetry, error report, or payment check.
- The extension does not read, log, store, transmit, or sell typed input. It does not read `input.value`, `FormData`, input events, or keystrokes.
- The only saved setting is whether protection is on. It is a boolean in `chrome.storage.local` under `protectionEnabled`. It is not synced by this extension, and it is not something the person typed into a form. `localStorage`, `sessionStorage`, and IndexedDB are not used.
- Dismissed warnings live in memory for that page only.
- Turning protection off stays off across navigation, refresh, a service-worker restart, and a browser restart, until the person turns it back on. A new install with no saved choice starts on.
- Messages between the popup, the worker, and the page are small and checked. The worker never receives page text. The popup summary is the hostname, the scheme, two counts, a status, and whether protection is on. It is not saved.
- A future website-reputation lookup is not included. It would need a separate approval, and that approval would have to name exactly what left the browser. Google Safe Browsing and Web Risk are not used.
- The product is free. Nothing in the interface asks for payment or hides a reminder behind an upgrade.

## How the pieces talk

The service worker reads and writes the on/off boolean. The popup may turn it on or off. A page cannot. After a successful save, the worker tells open tabs the new boolean. Content scripts also listen for that storage change, so a tab still updates if the broadcast is missed.

Each matching frame runs the content script. It asks the worker whether protection is on, scans fields, and answers the popup with a summary of that frame. Closed shadow trees in the same document are scanned with `chrome.dom.openOrClosedShadowRoot`. The extension cannot see inside a cross-origin frame's document; a separate content script runs there only when that frame's own address is `http` or `https`. Browser pages such as `chrome://` and the Chrome Web Store are outside the match patterns, so the popup says "Unable to determine".

Injected notes use a closed shadow root and `textContent`, so the page cannot rewrite the warning and the extension does not assign HTML strings. If a page removes the note or changes its style, the content script puts it back at most five times in ten seconds, then waits. A quiet gap allows another short burst. The note stays in normal document flow. It is not a blocking overlay.

A site can still cover the note with another element, and a site that keeps deleting it can hide it between repairs. The extension does not promise to stop a site that is trying to do that.

## Build and load

Requires Node.js 22 or newer. From this directory:

```bash
npm install
npm test
npm run build
```

`npm test` typechecks and runs the Node test runner. `npm run build` typechecks, bundles the content script into `dist/content.js` (Manifest V3 content scripts are classic scripts), and writes the icons. The service worker and popup stay ES modules. `dist/` is gitignored. Load the extension only after a build.

In Chrome, open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and select this repository root. `manifest.json` is at the root. Hands-on cases are in `store/manual-tests.md` and `store/install.md`.

## Mock pages

Open the fixtures over `http`, not as `file://` files. Content scripts are not injected into `file://` pages.

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8765/fixtures/`. The pages use fake labels only. They include login, registration, payment, email and phone, comments, Social Security number, card, bank, password, several fields, a field added later, a redrawn form, a page whose CSS tries to hide the note, an HTTP form action, misleading labels, and a suspicious-looking hostname. An `http://` page is what produces the insecure-connection signal. An `https://` page will not.

## Limits

- Rules, not a model. Explainable, and nothing on the page is sent away to be classified.
- Misses fields whose labels do not resemble the patterns, and fields inside cross-origin frames the extension is not allowed to enter.
- Lookalike detection is narrow. A novel phishing name often gets no site warning.
- A label of "Account number" warns as a bank account. That can include account numbers that are not bank accounts.
- The extension cannot inspect the certificate chain. It cannot promise a site is safe. The popup says that.
- A page can cover a reminder or keep removing it. Repairs are capped so the page does not get stuck in a loop. See `store/manual-tests.md`.
- No store listing has been submitted.

## Project layout

- `manifest.json` — Manifest V3. Permissions are `storage` plus host access for `http` and `https`, so a reminder can appear while the form is on screen and the on/off choice can be saved. People can still limit site access in Chrome.
- `src/background/service-worker.ts` — reads and writes the on/off boolean.
- `src/content/` — scan, metadata, reminder repair, and the note UI.
- `src/popup/popup.ts` — the popup.
- `src/shared/` — detection, copy, local site signals, message checks, the setting rule, and the privacy sentences.
- `tests/` — detection, copy, signals, messages, behavior, repair budget, scenario roles, store text, and a source scan that fails if values are read or data is sent.
- `fixtures/` — local mock pages.
- `store/` — listing, privacy policy, terms, install, support, manual checks, the security review, and the submission checklist.
