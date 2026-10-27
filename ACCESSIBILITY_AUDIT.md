# Accessibility audit

Shouldn't Wouldn't 0.1.1, October 26, 2026. Checked with Chrome's accessibility tree through the
DevTools protocol, real keyboard input in Chromium 156 (Playwright), contrast calculations, and code
review. **No screen reader was run** (NVDA, JAWS, VoiceOver, TalkBack); that remains a manual step
before submission.

## Problems found and fixed

| Problem | Effect | Fix | Test |
| --- | --- | --- | --- |
| The hidden Show button was drawn on notes for fields that are not masked (found after submitting 0.1.1, in the zoom and High Contrast checks) | An empty bordered box in every password, email, phone, address, date-of-birth, security-code, and health note, and an extra tab stop with no name | `[hidden] { display: none !important; }` in the note stylesheet, so the button's `display: inline-flex` no longer overrides `hidden`. Fixed in 0.1.2; the submitted 0.1.1 package has the bug | `behavior.test.mjs` "a note for a field that is not masked shows no empty Show button" |
| The note was inserted inside the field's `<label>` | Chrome computed the field's accessible name as "Social Security number Sensitive Information: This website is requesting your Social Security number. Only share this information with organizations you trust. Why am I seeing this? Dismiss". A screen reader would read all of that as the field's name, on every focus | The note goes after the label when the label is in normal block flow. The field's name is now just "Social Security number". The reminder is attached as an `aria-description`, read after the name | `behavior.test.mjs` "the note is not read as part of the field's name" |
| The insecure-connection panel appeared at the top of the page | Off-screen for anyone scrolled down, including screen magnifier users; a paused submit gave no feedback at all, visual or spoken | The panel sits right after the field's note; on a paused submit it scrolls into view and receives focus (it is a labeled region), and Go Back returns focus to the submit button | `behavior.test.mjs` "on a long http page…" |
| "Why am I seeing this?" did not expose whether it was open | Screen reader users could not tell the explanation had appeared | `aria-expanded` and `aria-controls`; "More Information" also has `aria-expanded` | `behavior.test.mjs` "reminder buttons have clear names…" |
| Several identical "Dismiss" buttons on one page | Ambiguous when listed by a screen reader | Accessible name "Dismiss this reminder" (visible word unchanged) | same |
| The note had no role or name | Read as loose text | `role="note"`, name "Shouldn't Wouldn't reminder"; the panel is `role="region"`, name "Shouldn't Wouldn't site reminder" | code review |
| Popup toggle changed its label ("Protection is on" / "off") and used `aria-pressed` | Announced inconsistently ("Protection is off, toggle button, not pressed") | `role="switch"` with the stable name "Protection" and `aria-checked`; the On/Off pill is visual only | settings test |
| Popup lost keyboard focus after toggling | Keyboard users were sent back to the top | Focus is restored to the switch after the save; the switch is never disabled while saving (a disabled button drops focus) | settings test asserts focus stays |
| Popup status used `aria-live` on an element recreated on each render | Changes were unlikely to be announced | `role="status"` | code review |
| No visible focus ring inside notes | Hard to see where focus is | `:focus-visible` outline (2 px, #1e3a5f, 10.9:1 on the note background) on note buttons and the panel | code review |
| Notes could disappear in Windows High Contrast | `box-shadow` outlines are dropped in forced-colors mode | Note, panel, and button borders switch to `CanvasText` under `forced-colors: active`. The field's red outline is still lost in that mode; the note itself remains | code review |

## Keyboard

- Tab order: field → Show (when the field is masked) → Why am I seeing this? → Dismiss → next field.
  Verified: Tab from the SSN field lands on the note's first button, and Enter toggles Show.
- All note and panel controls are native `<button>` elements, reachable and operable with Tab, Enter,
  and Space.
- Reminders never move focus on their own. Verified on a page where ten form sections load over one
  second: focus stays on the page body.
- The only deliberate focus move is on a paused submit, which is the person's own action and needs an
  explanation.
- Cost of the design: each masked field adds three tab stops, an unmasked one two. On a long form with
  many sensitive fields this is noticeable. Dismissing a note removes its stops.

## Screen readers (by inspection of the accessibility tree, not by listening)

- Field: name = its label; description = the reminder sentence, plus the site concern on an insecure or
  lookalike page.
- Buttons: "Show what you typed in this field" / "Hide what you typed in this field" (visible words
  "Show" / "Hide", which keeps the visible label inside the name), "Why am I seeing this?" (collapsed or
  expanded), "Dismiss this reminder".
- Icons are `aria-hidden`.
- Masked fields: see "Verified in the browser" below for what Chrome exposes.

## Visual

Contrast ratios, computed from the colors in the code (WCAG AA needs 4.5:1 for text, 3:1 for
non-text):

| Pair | Ratio |
| --- | --- |
| Note text #3f1d24 on #fff7f7 | 14.09 |
| Note border and field outline #9f1239 on #fff7f7 | 7.60 |
| Field outline #9f1239 on white | 8.02 |
| Button text #3f1d24 on white | 14.87 |
| Button border #7a2430 on white | 9.89 |
| Focus ring #1e3a5f on #fff7f7 | 10.90 |
| Popup text #2a1218 on #fffdfb | 17.27 |
| Popup labels #6b4a52 on #fffdfb | 7.59 |
| Switch "On" white on #7a2430 | 9.89 |

- Meaning never relies on color alone: every outline comes with a written note, and the switch shows
  the words On/Off.
- No animation or motion is used; a reduced-motion rule also disables any transition on the outline and
  note.
- Notes stay in normal flow and wrap; they never cover the page.

## Verified in the browser

- **Field name and description.** Chrome's accessibility tree for the masked SSN field: role
  `textbox`, name "Social Security number", description "Sensitive Information: This website appears
  to be asking for your Social Security number. Only share this information with organizations you
  trust."
- **Masked fields still expose their value to assistive technology.** After typing a synthetic value,
  the tree's value was the real characters, not dots. A screen reader user therefore hears what they
  typed, as with any text box; masking protects against eyes, not ears. (A password box behaves
  differently because its type is `password`, which the extension deliberately does not change.)
- **Placeholders stay readable** on a masked field, so format hints such as "123-45-6789" still show
  until the person types.
- **200% zoom.** At page zoom 2 the note wraps inside its 36rem maximum width, the buttons wrap onto
  new lines when needed, and nothing overlaps the field (screenshot taken during the audit, not stored
  in the repository).
- **Keyboard.** Tab from the field reaches the Show button inside the note; Enter toggles the mask.

## Remaining work

1. A real screen reader pass (NVDA or JAWS on Windows, VoiceOver on macOS): field announcement, Show/
   Hide, Why, Dismiss, the paused-submit panel, and the popup switch.
2. A test at 200% zoom and with Chrome's large default font on real sites, not only fixtures.
3. Forced-colors mode on Windows: the field outline is lost (by Chrome's design for `box-shadow`); the
   note remains. A forced-colors outline using `outline` instead could be added after a visual check.
4. The focus-triggered site panel is not announced when it appears (it is not a live region, to avoid
   interrupting typing). Its content is included in the field's description instead.
