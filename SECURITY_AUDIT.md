# Security and privacy audit

Shouldn't Wouldn't 0.1.1, audited October 26, 2026, against commit `8b2b2ec` plus the uncommitted
changes in this working tree. Nothing was committed, pushed, or published. This is an engineering
review, not a certification, and passing tests do not make the extension "secure".

Companion reports: [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md),
[DETECTION_ACCURACY.md](DETECTION_ACCURACY.md), [ACCESSIBILITY_AUDIT.md](ACCESSIBILITY_AUDIT.md),
[CHROME_WEB_STORE_CHECKLIST.md](CHROME_WEB_STORE_CHECKLIST.md),
[FEATURE_FEASIBILITY.md](FEATURE_FEASIBILITY.md).

## Method

1. Read every source file, the manifest, the build scripts, the fixtures, the tests, and the store
   documents. Compared each written claim with the code.
2. Static checks: `npm audit`, a scan of git history for credentials, and the source scan in
   [tests/privacy-scan.test.ts](tests/privacy-scan.test.ts) (extended in this audit).
3. A **runtime privacy probe**: [tests/browser/probe-prelude.js](tests/browser/probe-prelude.js) is put
   in front of the built content script in a test-only copy of the extension. It runs in the content
   script's isolated world and wraps every API through which a typed value could be read or sent:
   `value`/`defaultValue`/`valueAsNumber`/`selectedIndex`/`selectedOptions` getters, `getAttribute("value")`
   and `Attr.value`, `innerText`, `textContent`/`nodeValue`/`data` of text inside a `textarea` or an
   editable region, `FormData`, input/keyboard/clipboard listeners, the clipboard API, `getSelection`,
   `execCommand`, `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`,
   `RTCPeerConnection`, workers, `src`/`href`/`action` setters, and `chrome.runtime.sendMessage` and
   `chrome.storage.local.set` payloads. A canary read proves the traps are live in that world.
4. Real-browser tests in Playwright's Chromium 156 (Chrome for Testing), loading the unpacked
   extension, with every page served from local fixtures through request routing so nothing reaches
   the network: `npm run test:browser`.

## Architecture and data flow

```
 web page (any http/https frame)
   │  DOM metadata only: type, name, id, autocomplete, placeholder, label text, aria-label,
   │  aria-describedby text, previous sibling text, legend text (text of form controls and
   │  editable regions is skipped)
   ▼
 content script (isolated world, dist/content.js)
   ├─ classifies fields locally (src/shared/detect.ts)
   ├─ inserts notes in closed shadow roots; sets an outline, aria-description, and, for
   │  high-sensitivity number fields, -webkit-text-security on the field
   ├─ reads chrome.storage.local "protectionEnabled" (boolean) and listens for changes
   ├─ answers the popup with: hostname, scheme, two counts, status, protection, reminderHidden
   └─ tells the worker "page/reminderHidden" / "page/left" (type only) when a page hides a note
 service worker
   ├─ the only writer of "protectionEnabled", and only for a message from this extension's popup.html
   └─ sets or clears the toolbar badge "!" for the sending tab
 popup
   └─ shows the summary; asks the worker to change the setting
```

No network requests are made by any part of the extension. Nothing typed into a page is read, so
nothing typed can be logged, cached, stored, messaged, or sent.

## Differences between the stated promise and the code (found at the start)

| Claim | What the code did | Status |
| --- | --- | --- |
| "It never reads what a person types." | The label/nearby-text reader walked text nodes and skipped only `input`, `textarea`, and `select`. Text a person typed into an **editable region** (`contenteditable`, such as a rich-text box) next to a field or inside its label was read. Confirmed by the probe on the original build. | **Fixed** (SW-01) |
| Labels are page text. | The same reader included `<option>` text of a drop-down inside a label. Not typed data, but it caused a false SSN warning. | **Fixed** (SW-02) |
| "Closed shadow trees in the same document are scanned." | True, by asking Chrome for every element on the page, which was slow on large pages. | Changed: closed roots are looked up on custom elements only (SW-08), documented |
| Security review: "npm test was 30 passing tests". Earlier report: 24/24. | 21 tests existed at the start. | Docs corrected |
| "Each matching frame ... asks the worker whether protection is on." | True; every frame of every page load woke the worker. | Changed: content scripts read the boolean from storage directly (SW-09) |
| Labels near a field may contain private data. | `aria-describedby` text is read. Some sites echo the typed value into an error message referenced this way. | **Residual risk**, documented below |

## Findings

Severity: **High** = breaks a core promise or a core flow for ordinary users; **Medium** = a real
defect with limited reach; **Low** = hardening or a narrow defect.

| ID | Severity | Area | Finding | Fix | Regression test |
| --- | --- | --- | --- | --- | --- |
| SW-01 | **Medium** | Privacy | Typed text in editable regions was read as label/nearby text. It stayed in memory for matching and was never stored or sent, but it broke the promise. Reproduce: [fixtures/privacy-probe.html](fixtures/privacy-probe.html), type into the editable box, original build records `textContent of typed text` reads. | [src/content/metadata.ts](src/content/metadata.ts): skip text inside any `[contenteditable]` (attribute check, no style pass) and inside `option`/`optgroup`/`datalist`/`noscript`/`template` | `tests/browser/privacy.test.mjs` (fails on original, passes now) |
| SW-02 | Low | Accuracy | Drop-down option text became label text. | Same change | same |
| SW-03 | **High** (accessibility) | UX | The note was inserted inside the field's `<label>`, so screen readers announced the field as "Social Security number Sensitive Information: This website is requesting… Why am I seeing this? Dismiss". Measured with Chrome's accessibility tree. | [src/content/controller.ts](src/content/controller.ts) `anchorFor`: the note goes after the label when the label sits in normal block flow; inside the label only when it is one item of a flex/grid row. The field gets an `aria-description` with the short reminder. | `behavior.test.mjs` "the note is not read as part of the field's name" |
| SW-04 | **High** | UX / reliability | The site panel (HTTP page, HTTP form, lookalike) was inserted at the top of `<body>`. On a long page it appeared off-screen, and a paused submit looked like a broken button: nothing visible happened. Reproduce: [fixtures/long-page.html](fixtures/long-page.html) over `http://`. | Panel goes right after the warned field's note. On a paused submit it is scrolled into view and receives focus; Go Back returns focus to the button. | `behavior.test.mjs` "on a long http page…" |
| SW-05 | **Medium** | Reliability | "Continue Anyway" resubmitted with `form.requestSubmit()` and dropped which button was pressed. On a form with "Save" and "Delete" buttons it could perform a different action. Reproduced: original submitted `?ssn=…` without `action=delete`. | `resumeSubmit` passes the original submitter when it is still a submit button of that form | `behavior.test.mjs` long-page test checks `go=sign-in`; [fixtures/validation.html](fixtures/validation.html) |
| SW-06 | Medium | Reliability | The popup asked *all* frames of the tab for a summary and took the first answer, so an ad or widget frame could answer for the page (wrong hostname and counts). | `chrome.tabs.sendMessage(..., { frameId: 0 })` | `behavior.test.mjs` "the popup describes the top page" |
| SW-07 | Low | Reliability | Right after a toggle, the popup could ask a page for its summary before the page had applied the change (found by inspection; not reproduced). | The content script re-reads the saved boolean before answering | Settings tests in `behavior.test.mjs` |
| SW-08 | Medium | Performance | The scan asked Chrome for a closed shadow root on **every element** (32,520 calls on the 30,000-element fixture), recomputed site concerns once per warned field (quadratic), and ran a document-wide `label[for]` query per field. | One tree walk per added subtree; open roots via `el.shadowRoot`; closed roots only on custom elements; concerns once per batch; one `label[for]` index per batch instead of a query per field (Chrome's own `labels` property was tried and rejected: slower, and it leaves live lists that slow later page changes); each field's text normalized once instead of once per category; reads before writes; no redundant writes; deduplicated mutation records | Measured in [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) |
| SW-09 | Low | Reliability / performance | Each frame load messaged the worker to read one boolean (waking it), and if the worker did not answer, protection silently turned on. | Content scripts read `chrome.storage.local` directly; the worker stays the only writer | `privacy-scan.test.ts` (one read, no writes); settings tests |
| SW-10 | Medium | Detection | False positives (sign-in codes as card codes, library/loyalty cards as payment cards, yes/no drop-downs as SSN) and false negatives (home/billing/shipping address, SSN in a password box, account numbers in `type="tel"`). | Rule changes in [src/shared/detect.ts](src/shared/detect.ts) | [tests/accuracy.test.ts](tests/accuracy.test.ts), [DETECTION_ACCURACY.md](DETECTION_ACCURACY.md) |
| SW-11 | **Medium** | Detection | Real country sites such as `amazon.com.au`, `google.com.br`, `amazon.com.mx` were flagged as lookalikes, which paused card submits on real Amazon Australia/Mexico/Brazil checkouts. | `brand.com.XX` with a two-letter country ending is not a lookalike | `signals.test.ts`; `behavior.test.mjs` "country sites of a brand…" |
| SW-12 | Low | Copy | "This website is requesting your Social Security number" stated a certainty the rules do not have. | "appears to be asking for" | `copy.test.ts` |
| SW-13 | Medium | Tamper resistance | A page that deleted or covered the note left no trace outside the page. | Out-of-page signal: toolbar badge "!" for that tab plus a popup line, after the repair budget runs out or when a focused field's note is covered | `behavior.test.mjs` "hostile pages" |
| SW-14 | Low | Accessibility | Popup toggle changed its label with its state and used `aria-pressed`; re-rendering dropped keyboard focus. | `role="switch"` with a stable name "Protection"; focus restored after saving | `behavior.test.mjs` settings test |
| SW-15 | Low | Robustness | A storage read error made the worker's callback throw (`items` undefined), leaving the request unanswered. | `items?.[...]` in worker and content script | Unit tests; code review |
| SW-16 | Low | Usability | The setting could only be changed from the popup, not from `popup.html` opened in a tab (which some keyboard and screen-reader users do). The extra check added no security, because web pages cannot open, embed, or message `popup.html`. | Sender must be exactly this extension's `popup.html` | `messages.test.ts`; settings tests |
| SW-17 | Low | Hardening | The static scan missed `getAttribute("value")`, `defaultValue`, `innerText`, clipboard APIs, and input/keyboard listeners. | Scan extended; runtime probe added | `privacy-scan.test.ts`, `privacy.test.mjs` |
| SW-18 | Low | Performance | Re-scans rewrote identical attributes, styles, and text, producing extra mutation records for the page. | Write only when different | Probe counts in the performance report |

New in this audit, not a finding: **CSS-only masking** of high-sensitivity number fields with a
Show/Hide eye button. It never reads the value and never changes the field type. See
[FEATURE_FEASIBILITY.md](FEATURE_FEASIBILITY.md).

## Previous audit findings, reassessed

| Earlier finding | Reassessment |
| --- | --- |
| Websites can hide or remove warnings | **Confirmed.** Mitigated (SW-13, existing repair budget, inline `!important` styles), not solved. See "Hostile pages". |
| Broad HTTP/HTTPS host access needed but increases exposure | **Confirmed.** Still needed; trade-offs below. |
| On/off switch may reset after service-worker shutdown | **Not reproduced.** The original code already stored the boolean in `chrome.storage.local` and kept no in-memory copy. The new build passes a test that stops the worker, reloads pages, opens a new tab, toggles five times, and fully restarts the browser on the same profile. |
| Privacy policy and terms need final review | Reviewed and updated for masking, the badge, and the storage read. The policy is public on GitHub; both still need a person's sign-off. |
| Store publishing assets incomplete | Screenshots and the small promo tile are now in `store/assets/`, and the policy is public on GitHub. See the store checklist. |
| "24/24 tests passing", "npm audit 0" | At the start: 21 tests, all passing; `npm audit`: 0. Now: 38 unit tests, 32 browser tests (6 privacy, 23 behavior, 3 release), `npm audit`: 0. |

## Manifest and permission review

| Item | Value | Assessment |
| --- | --- | --- |
| `manifest_version` | 3 | Correct |
| `permissions` | `["storage"]` | Minimal: one boolean |
| `host_permissions` / content-script matches | `http://*/*`, `https://*/*` | Needed so a reminder can appear on any form without the person first clicking. `activeTab` would only work after a click on the toolbar button, which defeats a reminder. Optional per-site permissions would leave most people unprotected. The exposure is real: if the content script had a bug, it would have it on every site. Kept, with the justification in the store checklist. |
| `all_frames`, `match_about_blank`, `match_origin_as_fallback` | true | Needed for checkout and login forms inside frames and in `about:blank`/`srcdoc` frames whose origin is an http(s) page. Each frame gets its own isolated content script. |
| `content_security_policy.extension_pages` | `default-src 'self'; script-src 'self'; object-src 'self'; base-uri 'self'` | Strict; no remote code, no `unsafe-*`. Unchanged. |
| `web_accessible_resources` | none | Pages cannot load extension files, which also means pages cannot frame `popup.html`. Asserted by a test. |
| `externally_connectable` | none | Web pages cannot message the extension. Asserted by a test. |
| Remote code | none | All logic is in the package. |
| `minimum_chrome_version` | 120 | Covers `chrome.dom.openOrClosedShadowRoot`, `match_origin_as_fallback`, and `SubmitEvent.submitter`. |

## Messaging

- Every message is parsed by [src/shared/messages.ts](src/shared/messages.ts): plain objects only, exact
  key sets, typed values, and a deny-list of keys such as `value`, `password`, `url`, `html`, `cookie`.
- The worker rejects any sender that is not this extension. `sw/setEnabled` must come from exactly
  `chrome-extension://<id>/popup.html`. `page/reminderHidden` and `page/left` must come from a content
  script in a web-page tab and carry nothing but their type.
- Content scripts accept messages only from this extension and only of known types.
- The popup accepts a page summary only if it has exactly the expected keys and types.

## DOM injection and XSS

- All extension text is set with `textContent`. There is no `innerHTML`, `outerHTML`,
  `insertAdjacentHTML`, `document.write`, `eval`, or `new Function` (enforced by the source scan).
- The eye icon is built with `createElementNS` and constant attribute values.
- Page-controlled strings (labels, names, placeholders) are only matched against regular expressions.
  They are never rendered, stored, or sent. The popup shows only the hostname, through `textContent`.
- Notes live in closed shadow roots with their own stylesheet, so page CSS and scripts cannot reach or
  rewrite their contents.

## Hostile pages

Tested with [fixtures/perf/hostile.html](fixtures/perf/hostile.html) (deletes the note on every frame,
restyles the field, and keeps a white box over the note area),
[fixtures/covered.html](fixtures/covered.html), [fixtures/unusual-css.html](fixtures/unusual-css.html),
and [fixtures/spa.html](fixtures/spa.html).

What holds:

- The page cannot read or change a note's words or buttons (closed shadow root).
- Page stylesheets cannot hide the note: the host's inline `!important` styles win (`display`,
  `visibility`, `opacity`, `transform`, `clip-path`, `height`, `position`, `z-index`, …).
- A removed or restyled note is put back at most **5 times in 10 seconds**, then the extension waits.
  On the hostile page the note was removed 6 times in 3 seconds and then stayed gone. There is no
  reinsertion loop and no repeated fight with the page.
- When the budget runs out, or when a warned field gets focus and two hit tests show something on top
  of its note, the extension sets a **"!" badge** on its toolbar button for that tab (tooltip: "this page
  removed or covered a reminder") and the popup says so. The page cannot reach the toolbar. The badge
  clears when that page goes away.

What does not hold, and cannot be promised:

- A page can hide the note between repairs, or permanently after the budget, or cover it with an
  element that lets clicks through (hit tests skip such elements), or hide it through an ancestor
  (for example `opacity: 0` on the form), or draw a fake note of its own.
- A page can detect that the extension is installed (the note host and the field attributes are
  visible to it).
- A page that keeps its own submit handler can still send data even when the extension pauses the
  form's native submission. The extension never claims to block a site.

## Privacy verification summary

| Question | Evidence | Result |
| --- | --- | --- |
| Reads typed values? | Source scan; runtime probe with synthetic values typed, pasted, filled by script, revealed, and submitted on HTTPS and HTTP pages; canary proves the probe works | No reads recorded in the new build. The original build read text typed into editable regions. |
| Records keystrokes? | No input/key listeners (scan and probe) | No |
| Stores anything but the setting? | Worker storage dump in the browser test; scan | Only `protectionEnabled: boolean`; session storage empty |
| Sends anything? | Scan for network APIs; probe traps; every page request routed locally and anything else recorded | No network calls; messages carry no synthetic value |
| Analytics, ads, accounts, payments? | Source review | None |

**Residual privacy limits, stated honestly:**

1. **Echoed values in page text.** If a site writes the typed value into the text of an element that
   the field points to with `aria-describedby` (for example "Check the number: 900-…"), that page text
   could be read when the field is classified again after an attribute change. It is used only for
   pattern matching in memory and is never stored or sent. The probe cannot flag this, because it is
   ordinary page text.
2. **Proving a negative.** The probe covers the APIs listed above in the content script's world. It
   cannot prove that no other path exists, and it does not instrument the service worker (whose source
   is small and is covered by the static scan).
3. **Masking is not encryption.** It changes only what the screen shows.

## Pre-launch checklist (20 items)

| # | Item | Result | Why |
| --- | --- | --- | --- |
| 1 | Hide API keys | **N/A / PASS** | No API keys exist in the code or history |
| 2 | Purge Git secrets | **PASS** | History scanned for keys, tokens, and private keys: none. Two commits; no rewrite needed or done |
| 3 | Use public database keys | **N/A** | No database |
| 4 | Enable row-level security | **N/A** | No database |
| 5 | Encrypt sensitive data | **N/A** | No sensitive data is stored. The only stored value is the on/off boolean |
| 6 | Enforce server-side authentication | **N/A** | No server or accounts |
| 7 | Lock record access | **N/A** | No records |
| 8 | Block field tampering | **PASS** (applicable sense) | Messages are strictly validated; only the popup can change the setting; pages cannot message the extension |
| 9 | Secure session cookies | **N/A** | No cookies |
| 10 | Hash passwords | **N/A** | No passwords are handled; typed passwords are never read |
| 11 | Rate-limit login | **N/A** | No login |
| 12 | Add bot protection | **N/A** | No server endpoint |
| 13 | Parameterize database queries | **N/A** | No database |
| 14 | Validate all input | **PASS** | All messages validated; page metadata treated as untrusted and only pattern-matched |
| 15 | Escape user content | **PASS** | `textContent` only; no HTML sinks (enforced by scan) |
| 16 | Restrict file uploads | **N/A** | No uploads |
| 17 | Trim API responses | **PASS** | The page summary is seven small fields plus one flag, validated by exact keys |
| 18 | Add security headers and CSP | **PASS** for the extension; **MANUAL** for the website | Strict extension CSP; the future privacy-policy/support site needs its own HTTPS and headers |
| 19 | Enforce HTTPS where applicable | **N/A** for the extension (no network); **MANUAL** for the policy URL | The store requires the privacy policy at a public URL; host it over HTTPS |
| 20 | Scan dependencies | **PASS** | `npm audit`: 0 vulnerabilities. All dependencies are development-only (TypeScript, Playwright, React for a test page). The shipped package contains no third-party code |

## Remaining risks

1. Broad host access: a future bug in the content script would run on every site.
2. A hostile site can still hide reminders (above).
3. Detection is rule-based and English-only; misses and extra warnings remain on real sites.
4. Chrome's real autofill UI, password managers, Vue, Angular, and screen readers were not tested.
5. Gmail and other sites are covered by the same host access; email features must stay out until
   separately approved (see the feasibility report).
6. Extension updates leave old content scripts running in already-open tabs until they reload; those
   keep showing reminders but stop following the on/off switch.
7. Server-rendered React pages that attach ("hydrate") late can conflict with notes inserted before
   hydration. On [fixtures/perf/react-ssr.html](fixtures/perf/react-ssr.html) with hydration delayed
   1.5 s, React reported 4 recoverable hydration errors and re-rendered that part of the page; the
   extension then re-added its notes and the form kept working. With immediate hydration there were no
   errors. The cost falls on the site (one extra render). Placing notes outside the page's own
   containers (for example, positioned overlays at the end of `<body>`) would avoid this but is a larger
   design change with its own layout and accessibility trade-offs.
8. Masked fields still expose their real value to screen readers (by design of `-webkit-text-security`).
