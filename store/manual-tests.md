# Manual checks

Version 0.1.1. Automated checks cover the field rules and the repair budget. The browser column is what was actually seen in Chrome 156 on October 25, 2026 (Pacific), with the unpacked extension and the local fixture server. It is not a Chrome Web Store install. The toolbar popup was not opened. A full quit was done once, on a test profile, to check the saved on/off choice.

Serve the fake pages, then load the unpacked extension after `npm test` and `npm run build`:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/fixtures/`. Do not type real personal information. The pages do not need anything typed into them.

## Expected reminders

| Page | Expect | Browser result |
| --- | --- | --- |
| `login.html` | Password gets a reminder. Username stays quiet. | Seen. Password marked, username not. |
| `register.html` | Email, phone, and password get reminders. Full name stays quiet. | Seen. Those three were marked. Full name was not. The milder wording was not read off the screen; the field rules are covered by the automated tests. |
| `payment.html` | Card number and security code get reminders. Name on card, expiration, and order note stay quiet. | Seen. Card number and security code marked. The other three were not. |
| `ssn.html` | Social Security number gets a reminder. Comments stays quiet. | Seen, including a screenshot. The note read: "Sensitive Information: This website is requesting your Social Security number. Only share this information with organizations you trust." Comments had no note. |
| `email-phone.html` | Both fields get the milder reminder. | Both fields were marked. The on-screen sentence was not read. |
| `comment.html` | No reminder. | Seen. No note. |
| `dynamic.html` | The page starts quiet. After "Add a Social Security field", one reminder appears. | The added field was marked. The empty start was not separately recorded. |
| `spa.html` | After "Draw the form", the password is reminded and the username is quiet. "Replace the form" inserts a new password field and the reminder appears again. "Remove the note" deletes only the reminder; it should come back. Removing it more than five times within ten seconds can leave it gone until a later try, after a quiet gap. | Draw: password marked, username not. Replace was not clicked. Remove: the note was present after each of the first five removals, then stayed gone on the sixth and seventh. The ten-second recovery was not waited out in the browser. The budget rule is also covered by an automated test. |
| `unusual-css.html` | The page stylesheet tries to hide the note and the red mark. The note should still be readable, because the extension sets its own inline styles. An element placed on top of the note is not part of this page and can still cover it. | The note stayed `display: block`, `visibility: visible`, and `opacity: 1`. It was not screenshotted. A covering element was not tried. |
| `http-form-action.html` over `http://` | A warned field plus the insecure-connection note when that field is focused or the form is submitted. | Not run in the browser. |
| `suspicious-looking.html` | Ordinary field stays quiet even if the page looks alarming. | Not run in the browser. |

## Settings and more than one tab

1. Turn protection off in the popup. The status becomes "Unable to determine" and the page reminders disappear.
2. Refresh the page. Protection stays off.
3. Open a second http page in another tab. Protection stays off there too.
4. Quit Chrome, open it again, and return to an http fixture. Protection stays off.
5. On `chrome://extensions`, click the extension's service worker link so Chrome stops or restarts that script, then reopen the popup. Protection stays off.
6. Turn protection on. Reminders return on the fixture, including a tab that was already open.
7. Remove the extension. The saved choice is deleted with it.

What was actually done, on a temporary Chrome profile, by setting the saved boolean directly rather than clicking the popup:

- Turning the saved choice off removed the note on the open page. Reloading left it off.
- A second tab opened while protection was off also had no note.
- Closing the service worker and letting Chrome start it again left the saved choice off, and the reloaded page still had no note.
- Quitting Chrome and opening the same profile again kept the choice off. The Social Security page had no note until the choice was set back on. The note then returned, with the Social Security sentence above.

Not done: clicking the toolbar popup, using the service-worker link on `chrome://extensions`, or removing the extension to confirm Chrome deletes the saved choice. The popup's own words were not read off the screen.

## Known misses and extra warnings

These come from the field rules, and `tests/scenarios.test.ts` locks them in:

- Text near a field is not enough. A search box does not warn just because the paragraph beside it mentions a Social Security number.
- "Social" alone, and "Mother's maiden name", stay quiet.
- A label that says "Account number" warns as a bank account, even when it might be a loyalty or utility account. That is a known extra warning.
- The word "pan" by itself is treated as a card number.
- A password box warns from its type, even when the label is vague.
- Fields inside a cross-origin frame are invisible to the parent page. A frame gets its own reminder only when that frame's address is `http` or `https`.
- `chrome://` pages, the Chrome Web Store, PDFs, and `file://` pages do not get a content script. The popup says "Unable to determine".

## What not to expect

A site that covers the reminder with another element, or that keeps deleting it, can hide it. The extension puts a removed note back at most five times in ten seconds, then waits. It does not promise to win against a site that is trying to hide the note.
