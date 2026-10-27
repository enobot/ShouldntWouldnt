# Chrome Web Store checklist

Version 0.1.1 was submitted to the Chrome Web Store on October 26, 2026 and is pending Google's
compliance review. Google has not approved or published it yet. On submission the dashboard warned that
broad host permissions may need an in-depth review, which can take longer; the permissions were kept on
purpose (see "Permission justifications"). Version 0.1.3 is packaged and waits for that review to finish
before upload. It fixes a display bug found after submission, keeps notes out of the page's own field
boxes, stops reminders for email, password, and phone fields on ordinary HTTPS pages, and adds maiden
names, security answers, and license plates. Its listing text in `store/listing-detailed.md` changed to
match; paste the new text into the dashboard with the 0.1.3 upload. This file replaces `store/submission-checklist.md` as the
working list; that file now points here.

Policy sources checked on October 26, 2026:

- Chrome Web Store Program Policies,
  https://developer.chrome.com/docs/webstore/program-policies/policies (page last updated 2025-05-22).
- Listing requirements, https://developer.chrome.com/docs/webstore/program-policies/listing-requirements
  (2024-07-10): a listing without a description, icon, or screenshots is rejected.
- Store listing tab, https://developer.chrome.com/docs/webstore/cws-dashboard-listing (2020-12-07): "Only
  the store icon and at least one screenshot are required." Screenshots 1280×800, up to five; small
  promo tile 440×280; marquee 1400×560.
- Supplying images, https://developer.chrome.com/docs/webstore/images (2018-06-11): store icon 128×128
  PNG, artwork about 96×96 with 16 px transparent padding; items without a small promo tile are shown
  after items that have one.
- User data FAQ, https://developer.chrome.com/docs/webstore/program-policies/user-data-faq: data that is
  only processed on the device must still be disclosed (FAQ 3), and any item that handles user data must
  post a privacy policy (FAQ 14).

## Status at a glance

| Area | Status |
| --- | --- |
| Submission | **Submitted** October 26, 2026 by the account owner; pending review |
| Manifest V3, permissions, CSP, no remote code | **Done** (verified by tests) |
| Working popup, reliable reminders, masking | **Done** in Chromium automation; still needs a person to click through `store/manual-tests.md` in branded Chrome |
| Release ZIP | **Done**: `npm run build && npm run package` writes `release/shouldnt-wouldnt-<version>.zip` (currently 0.1.3; 16 files: the manifest, popup, styles, icons, the bundled content script, and only the modules the service worker and popup import; no tests, no TypeScript, no source maps); `tests/browser/release.test.mjs` unzips it, loads it, and checks that a reminder appears, the popup renders, and the packaged worker saves the switch |
| Privacy policy matches the code | **Done** (`store/privacy-policy.md`, updated for masking, the badge, and the store's data disclosure) |
| Privacy policy at a public HTTPS URL | **Done**: https://github.com/enobot/ShouldntWouldnt/blob/main/store/privacy-policy.md (pushed October 26, 2026) |
| Support email works | **Blocker until checked**: `support@shouldntwouldnt.com` is used consistently. The domain has mail (MX) records pointing to Google, so an inbox may exist; delivery was not tested |
| Screenshots | **Done**: five 1280×800 PNGs in `store/assets/` (`npm run store-assets`) |
| Small promo tile | **Done**: `store/assets/small-promo-tile.png`, 440×280 |
| Store icon | Acceptable: `icons/icon128.png`, 128×128 PNG. It is a plain generated mark drawn edge to edge, not the 96×96-with-padding layout Google suggests. A designed icon is recommended, not required |
| Data-use disclosures | **Entered** by the account owner at submission; the prepared answers are under "Privacy practices tab" below |
| Developer account, 2-Step Verification, trader declaration | **Done** by the account owner |
| Product decision on email/phone reminders | **Decided** October 26, 2026 (see below) |

## Completed requirements

- [x] `manifest_version: 3`, version `0.1.3` in both `manifest.json` and `package.json` (the package
      script refuses to build if they differ).
- [x] Name "Shouldn't Wouldn't" (18 characters); manifest description 90 characters, under the 132 limit.
- [x] Permissions: `storage` plus host access to `http://*/*` and `https://*/*`. No optional
      permissions, no `tabs`, `scripting`, `cookies`, `history`, `webRequest`, or `unlimitedStorage`.
- [x] Strict extension-page CSP; no `web_accessible_resources`; no `externally_connectable`.
- [x] No remote code: every script ships in the package; no `eval`; no remote `<script>`.
- [x] Icons at 16, 32, 48, 128.
- [x] The popup renders without errors from the packaged build.
- [x] No analytics, ads, accounts, payments, or network requests.
- [x] Product is free; nothing in the interface asks for payment.
- [x] The extension does not say a site is safe, verified, legitimate, or a scam.
- [x] Screenshots and small promo tile, 24-bit PNG with no alpha channel.

## Store listing tab

- **Description:** paste everything below the `---` line in `store/listing-detailed.md`.
- **Summary:** the store shows the manifest's `description` ("Think Twice Before You Share. Free local
  reminders before you enter sensitive information."). If the dashboard asks for a summary of its own,
  use the 131-character sentence in `store/listing-short.md`: "Think Twice Before You Share. Free local
  reminders when a page asks for sensitive information. Nothing you type leaves the browser."
- **Category:** choose Privacy & Security if the dashboard offers it; otherwise the closest productivity
  or tools category.
- **Language:** English.
- **Store icon:** `icons/icon128.png`.
- **Screenshots**, in this order, all from `store/assets/`:
  1. `screenshot-1-reminder.png`: the reminder beside a Social Security field.
  2. `screenshot-2-masking.png`: bank and Social Security numbers shown as dots.
  3. `screenshot-3-why.png`: "Why am I seeing this?" open.
  4. `screenshot-4-site-note.png`: a paused card payment on an HTTP page, with Go Back and Continue
     Anyway.
  5. `screenshot-5-popup.png`: the toolbar popup for the page behind it.
- **Small promo tile:** `store/assets/small-promo-tile.png`. No marquee tile (only needed to be featured).
- **Homepage URL and support URL:** optional. Use only addresses that are live when you submit.

How the images were made: `scripts/store-assets.mjs` loads the built extension in Playwright's
Chromium and opens the sample pages in `store/assets/pages/`. The pages are made-up organizations on the
reserved `.example` domain, and every typed value is synthetic. The notes, dots, site note, and popup in
the images are the extension's own output. Three things are staged: the left-hand caption panel is part
of the sample page; the pages are drawn at a 1.6 device scale so text stays readable when the store
shows them smaller; and the popup, which headless Chromium cannot open from the toolbar, is
`popup.html` loaded in a tab while the sample page is the active tab, then placed over a faded capture
of that page. Re-run `npm run build && npm run store-assets` after any change to wording or styling.

## Privacy practices tab

### Single purpose

> Shows a local reminder when a web form appears to ask for sensitive personal or financial
> information, and can hide those characters on screen as you type, so a person can pause before
> sharing. It is not a verdict that a website is safe.

Masking is part of the same purpose (protecting the same fields at the same moment). Email checks and
merchant lookups would likely be judged as additional purposes; see
[FEATURE_FEASIBILITY.md](FEATURE_FEASIBILITY.md) before adding either.

### Permission justifications

- **Host permissions (`http://*/*`, `https://*/*`):** The reminder must appear beside a form while it is
  on screen, on whatever site the person visits, without the person first clicking the toolbar button.
  The content script reads only field metadata (control type, name, id, autocomplete hint, placeholder,
  label text, and nearby description), the page hostname and scheme, and the `action` of a form that
  contains a warned field. It never reads what the person types and sends nothing anywhere.
- **`storage`:** Remembers one setting in this browser profile: whether protection is on or off.

### Remote code

"No, I am not using remote code." Every script is in the package.

### Data usage

Google's user data FAQ says data that is only processed on the device still has to be disclosed. An
earlier version of this file suggested leaving "Website content" unticked; that was wrong. Answer from
what the code does:

| Category | Tick? | Why |
| --- | --- | --- |
| Personally identifiable information | No | Field values are never read. A label that *asks* for a name or SSN is page text, covered below |
| Health information | No | Same: only labels are read |
| Financial and payment information | No | Same; masking changes drawing only, the value is not read |
| Authentication information | No | Passwords are never read |
| Personal communications | No | Text inside text areas and editable regions is skipped |
| Location | No | Not used |
| Web history | No | No list of visited pages is kept. The current page's hostname and scheme are read while the page is open and shown in the popup, never saved. If you prefer to over-disclose, ticking it is harmless; the policy already describes this |
| User activity | No | No keystroke, click, mouse, or scroll logging. The extension reacts to focus and submit on a warned field only to show or pause the note, and records nothing |
| **Website content** | **Yes** | Field labels, nearby text, and a form's `action` are read on the page to decide whether to show a reminder. They stay on the device and are not stored |

Then tick all three certifications: data is not sold or transferred to third parties outside the approved
uses; not used or transferred for purposes unrelated to the single purpose; not used or transferred to
determine creditworthiness or for lending. All three are true of this code.

### Privacy policy URL

https://github.com/enobot/ShouldntWouldnt/blob/main/store/privacy-policy.md

It shows the `main` branch, so a pushed edit to `store/privacy-policy.md` changes the published policy.
Keep it matching the disclosures above. If the policy moves later (for example to a page on
`shouldntwouldnt.com`, which showed a Squarespace "Coming Soon" page on October 26, 2026), update the URL
in the dashboard.

## Distribution tab

- Free. No in-app purchases.
- Visibility: Public (or Unlisted for a first review if you want to test the listing quietly).
- Regions: all, unless you have a reason to limit them.

## Test instructions for the reviewer (optional field)

> No account or setup is needed. Open any page with a payment form, for example a checkout page with a
> card number field. A short note appears under the field. (Email and password fields on an ordinary
> HTTPS page get no note by design.) Click the toolbar button to see
> the popup summary and the on/off switch. The extension makes no network requests.

## Submission

Submitted for review on October 26, 2026 by the account owner. Dashboard status: Pending Review.

- [x] Developer registration (one-time fee), 2-Step Verification, publisher name and contact email, and
      the trader/non-trader declaration. (No legal conclusion is made here about trader status.)
- [x] Privacy policy URL entered.
- [x] `release/shouldnt-wouldnt-0.1.1.zip` uploaded, the three tabs filled in, and submitted.

After submission:

- [x] `support@shouldntwouldnt.com` receives mail (confirmed by the account owner, October 26, 2026).
- [x] The account owner loaded the release ZIP in branded Chrome and reported that it works.
- [x] Zoom, large font, High Contrast, card autofill, and remove/reinstall checked in Chromium; see
      `store/manual-tests.md`. That found a bug in the submitted 0.1.1: notes for fields that are not
      masked show an empty Show button. Fixed in 0.1.2.
- [ ] The hand checks still listed in `store/manual-tests.md` (screen reader, password manager, real
      toolbar popup, address autofill).
- [ ] Upload `release/shouldnt-wouldnt-0.1.3.zip` from the dashboard once the 0.1.1 review finishes, and
      paste the updated description and test instructions.

If the review rejects the item, Google's email names the policy it applied. Fix that, then rebuild and
package, and upload the new ZIP from the dashboard.

## Product decision on email, password, and phone (decided October 26, 2026)

These fields appear on nearly every sign-in and newsletter form, and frequent notes teach people to
ignore them. Decision by the account owner, in 0.1.3: Email, password, and phone fields get a reminder only where the page gives a reason: it loaded over plain HTTP, its form would send over HTTP, or its address imitates a well-known site. The lookalike case is kept because a
fake sign-in page over HTTPS is exactly where a password reminder matters, and the site note only appears
next to a warned field.

## Do not claim

- That Google has reviewed or approved the extension.
- That a website is safe, verified, legitimate, or a scam.
- That the extension blocks a hostile page from hiding a reminder.
- That masking protects data from the website; it only changes the screen.
- That the extension is completely secure because the tests pass.
