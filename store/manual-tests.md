# Manual checks

Version 0.1.1. Most of what used to be checked by hand is now automated in a real browser
(`npm run test:browser`, Playwright's Chromium 156 with the unpacked extension; see
[SECURITY_AUDIT.md](../SECURITY_AUDIT.md)). The checks below are the ones automation cannot do, or
that must be repeated in branded Chrome with the real release ZIP before submission. Do not type real
personal information. The values below are synthetic.

Serve the fake pages, then load the unpacked extension after `npm test` and `npm run build`, or unzip
`release/shouldnt-wouldnt-0.1.1.zip` after `npm run package`:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/fixtures/`. Pages opened this way are `http`, so the insecure-connection
note is expected on them.

## Covered by automated browser tests (October 26, 2026)

| Page | What is asserted |
| --- | --- |
| `ssn.html` | SSN field marked; comments box quiet; field's accessible name is just its label; description carries the reminder; buttons named "Show what you typed in this field", "Why am I seeing this?" (with expanded state), "Dismiss this reminder" |
| `misleading-context.html` | No field marked although the page text talks about SSNs, cards, and bank accounts |
| `dynamic.html`, `spa.html` | Added and redrawn fields get reminders |
| `perf/lazy-components.html` | Fields in open and closed shadow roots of custom elements get reminders; no focus is taken |
| `masking.html` | SSN, card, and bank show dots; email, comments, and password untouched; Show and Hide work by mouse and by keyboard (Tab from the field, Enter); Dismiss removes note, outline, and dots; value unchanged |
| `validation.html` | Paste works; the browser's `pattern` check still blocks an invalid value; a script fill (as autofill does) stays masked; the site receives exactly the entered value and the pressed button |
| `perf/react-app.html` | React controlled inputs keep their state while masked; route changes get reminders |
| `long-page.html` over http | Site note appears next to the field, not at the top of the page; a paused submit brings it into view with focus; Continue Anyway sends the pressed button's value |
| `perf/hostile.html`, `covered.html`, `unusual-css.html` | Repairs stop after five in a burst; toolbar badge "!" and popup notice when a note is removed or covered; page CSS cannot hide the note |
| `frames.html` | The popup summary describes the top page; the frame gets its own reminders |
| Settings | Off survives a service-worker stop, reloads, a new tab, five toggles, and a full browser restart; switch keeps keyboard focus |
| `privacy-probe.html` | No value-reading, clipboard, input-listener, or network API is used by the extension; messages carry no typed value; storage holds only the on/off boolean |
| Release ZIP | Unzipped package loads, marks a field, the popup renders without errors, and the packaged worker saves the switch |

## Still to do by hand, in branded Chrome, before submission

1. Load the release ZIP (not the source folder) with Load unpacked.
2. Click the real toolbar button and read the popup on `ssn.html`, on `chrome://extensions`, and on a
   page with the protection switch off. The automated tests open `popup.html` in a tab instead.
3. On `masking.html`, use Chrome's own address autofill and card autofill (with test entries) and
   confirm the fields still fill and stay masked.
4. With a password manager installed, confirm it does not offer to save the SSN or card number.
5. Screen reader pass (NVDA on Windows or VoiceOver on macOS): focus the SSN field and confirm the
   label and reminder are read; Tab to Show, Why, and Dismiss; open the popup and toggle the switch.
6. At 200% browser zoom and with a large default font, confirm notes wrap and nothing overlaps.
7. Windows High Contrast (forced colors): confirm note borders and buttons stay visible.
8. Remove the extension and confirm the saved choice is gone when it is installed again.

The store screenshots are captured automatically (`npm run store-assets`, see
[CHROME_WEB_STORE_CHECKLIST.md](../CHROME_WEB_STORE_CHECKLIST.md)). Replace them by hand only if this
session shows something they do not.

## Earlier hand checks (October 25, 2026, Chrome 156)

Recorded before this audit: password, registration, payment, SSN, email/phone, comment, dynamic, and
SPA pages behaved as listed; the note on `unusual-css.html` stayed visible; repairs stopped after five
quick removals; the saved off choice survived a worker restart and a full quit. The toolbar popup, the
insecure-connection page, and the suspicious-looking page were not checked by hand then.

## Known misses and extra warnings

See [DETECTION_ACCURACY.md](../DETECTION_ACCURACY.md). In short: nearby text alone never warns; a bare
"Account number" warns as a bank account; "PAN" warns as a card number; sign-in codes and security
questions stay quiet; search boxes and drop-downs never get number warnings; cross-origin frames get
their own reminders only when their address is http or https; `chrome://` pages, the Chrome Web Store,
PDFs, and `file://` pages get no content script.

## What not to expect

A site that covers the reminder with an element that lets clicks through, hides it through a parent
element, or keeps deleting it can hide it. The extension puts a removed note back at most five times in
ten seconds, then marks the toolbar button. It does not promise to win against a site that is trying
to hide the note.
