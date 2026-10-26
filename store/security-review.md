# Security review for version 0.1.1

Reviewed October 25, 2026 (Pacific), against the code in this tree and the checks that fit a local Chrome extension. This is not a claim that the extension is completely secure. Passing tests does not make it so. Nothing was submitted to the Chrome Web Store.

## What the extension handles

It examines form metadata in the browser: control type, name, id, autocomplete, placeholder, label, ARIA text, and a short clip of nearby description. It also uses the hostname, the `http` or `https` scheme, and the `action` of a form that already has a warned field. The toolbar can show that summary while it is open.

The only value written to disk is whether protection is on. The key is `protectionEnabled` in `chrome.storage.local`. The value is a boolean. A missing or non-boolean value is treated as on. The service worker is the only writer, and only after the popup asks. Content scripts listen for the change. They do not write it.

Dismissed notes stay in memory until the page closes.

## Checklist that applies

| Check | Result |
| --- | --- |
| Secrets in the client | No API keys, tokens, or accounts. `npm audit` reported 0 vulnerabilities. The only dependency is TypeScript, used to build. |
| Git history | The published history before this work was one commit, a one-line README. This review did not rewrite history. |
| Typed form values | The source scan fails the build if the extension reads `.value`, `FormData`, keystrokes, or the value attribute. A browser check did not type into the forms. |
| Network and analytics | No `fetch`, XHR, WebSocket, beacon, or analytics calls in the extension source. The scan fails the build if those appear. |
| Storage | `localStorage`, `sessionStorage`, IndexedDB, and `chrome.storage.sync` are not used. `chrome.storage.local` stores only the boolean above. |
| Permissions | `storage`, plus host access for `http` and `https`. No history, cookies, debugger, tabs, or unlimited storage. The extension-page Content Security Policy is `default-src 'self'; script-src 'self'; object-src 'self'; base-uri 'self'`. |
| HTML injection | Warning text is set with `textContent` inside a closed shadow root. The source scan rejects `innerHTML` and `eval`. |
| Messages | Popup, worker, and page messages are small objects. Extra keys are rejected, including names such as `value`, `password`, and `url`. A page cannot turn protection off. The sender has to be this extension, and the write has to come from an extension page that is not a tab. |
| Other people's data | There are no accounts and no records to isolate. |

Database rules, login rate limits, cookies, password hashing, file uploads, and mobile entitlements do not apply. They were not added.

## What remains

A site can still cover a reminder with another element. The extension puts a removed or restyled note back at most five times in ten seconds, then waits. In Chrome, the sixth and seventh quick removals left the note gone. That cap is intentional so a page cannot trap the browser in a repair loop. It is not protection against a site that is trying to hide the note.

A label of "Account number" warns as a bank account. That can be a loyalty or utility account. Nearby text alone does not warn, so some real requests are missed. Lookalike hostnames are narrow on purpose.

The on/off boolean is not encrypted by the extension. It is not a form value. Chrome deletes extension storage when the extension is removed. That removal was not clicked in this review.

`npm test` was 30 passing tests. `npm run build` completed, and `node --check` accepted the built content script, service worker, and popup. The browser checks that were actually run are listed in `store/manual-tests.md`. The toolbar popup was not opened.
