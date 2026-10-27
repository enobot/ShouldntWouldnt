# Feasibility: masking, email checks, and merchant checks

Status as of this audit. **Only sensitive-field masking is implemented.** Email checks and merchant
checks are proposals. Neither has been built, and neither should be built until the permission and
data-flow changes below are approved, because both change the extension's privacy model.

The single product purpose stays: *help people think twice before sharing sensitive personal or
financial information online.*

| Capability | Status | New permissions | New data the extension handles | Recommended for first release |
| --- | --- | --- | --- | --- |
| 1. Mask sensitive fields as you type | **Implemented and tested** | None | None (presentation only) | Yes |
| 2. Email sender and sensitive-request check | Proposal only | None for Gmail in a browser tab, but the privacy policy and store disclosures must change | The content of one message the person chooses to check | No. A separate, opt-in later release, or a companion |
| 3. Merchant check | Proposal only | None for the recommended version | None sent automatically; the person chooses to open a review site | Partly: the user-directed version could ship later in the same extension |

---

## 1. Automatic sensitive-field masking (implemented)

1. **What Chrome allows.** Chrome supports the CSS property `-webkit-text-security`, which draws a
   text field's characters as discs without changing the field's value, type, or behavior. A content
   script can set it on a page's field. It does not need to read the field.
2. **What the architecture supports.** The extension already identifies fields from metadata and
   already sets an inline style (the red outline) on them. Masking adds one more inline style and a
   matching attribute rule in `content.css`.
3. **Permissions.** None beyond the existing ones.
4. **Data accessed.** None. The value is never read, copied, or moved into another field. There is no
   input or key listener. The real-browser privacy test traps the value getters, `getAttribute("value")`,
   text inside editable regions, clipboard APIs, and input/keyboard listeners in the extension's
   isolated world, and records zero uses while synthetic values are typed, pasted, revealed, and
   submitted.
5. **Privacy implications.** Positive. It reduces casual on-screen exposure (someone looking over a
   shoulder, a screen share, a screenshot). It is not data security: the website still receives what
   is entered, exactly as before, and a website's own scripts can still read the field.
6. **Performance.** One style property per masked field, set once. No per-keystroke work.
7. **Compatibility.** Tested in Chromium with: plain inputs, `type="tel"` and `type="number"`, a React 18
   controlled input, paste, a programmatic fill (as autofill does), the browser's own `pattern`/
   `required` validation, a form with two submit buttons, dynamic forms, and keyboard-only use.
   Not tested: Chrome's real autofill UI (it cannot be driven by automation), real password managers,
   Vue and Angular apps, and screen readers. Chrome still exposes the real characters of a masked field
   to assistive technology (checked in the accessibility tree), and placeholders stay readable. Why the input type is not changed to `password`: Chrome
   would then offer to save the SSN or card number as a password, autofill and validation would change,
   frameworks that read `type` could break, and password managers would treat it as a login.
8. **Accuracy limits.** Masking follows detection. A missed field is not masked; a wrongly detected
   field is masked and can be revealed with Show.
9. **Implementation.** Masked kinds: Social Security, card number, bank account, routing number,
   government ID, passport, driver's license. Only `input` elements of type text, tel, or number.
   Passwords already hide; card security codes, textareas, selects, email, search, and custom controls
   are left alone and get the normal reminder. Each note gets an eye button, "Show" / "Hide", with the
   accessible names "Show what you typed in this field" / "Hide what you typed in this field".
   Dismissing a note or turning protection off removes the mask.
10. **Release.** Included.

---

## 2. Email sender and sensitive-request warnings (proposal)

### What Chrome and the mail providers allow

- **Gmail in a browser tab.** The extension already has host access to `https://*/*`, which includes
  `mail.google.com`, so a content script can technically read an open message's rendered text, the
  sender address Gmail puts in the page, and link targets. No new manifest permission would be
  required. That is exactly why it must not happen silently: the extension today promises it does not
  read what is on the page beyond field labels.
- **Gmail's internal page structure** is undocumented and changes often. Code that reads it is fragile
  and needs constant maintenance.
- **Gmail API (OAuth).** Reading message content needs a restricted scope such as `gmail.readonly`.
  Restricted Gmail scopes require Google OAuth verification and, for apps that handle the data on a
  server, a yearly third-party security assessment (CASA). That is heavy for a free, account-free
  extension, and an OAuth token is itself a sensitive credential to hold.
- **Google Workspace add-on (a separate product, not a Chrome extension).** The officially supported
  way to "check this email" inside Gmail. It uses the scope
  `gmail.addons.current.message.readonly`, which Google lists as *sensitive* (not restricted) and which
  grants temporary access to the one message that is open while the add-on runs. It runs in Apps Script
  on Google's servers, needs OAuth verification, and is published on the Google Workspace Marketplace.
- **Outlook on the web** has a similar official route (an Office add-in). A Chrome content script could
  also read Outlook's page, with the same fragility.
- **SPF, DKIM, DMARC.** A Chrome extension cannot verify these itself. Gmail shows provider-verified
  "mailed-by" and "signed-by" lines in a message's details, and the full `Authentication-Results`
  header under "Show original". Reading those means scraping Gmail's page or the raw message. The
  extension must not claim verification it did not get from the provider, and even a passing result
  only means the sending domain was not forged; it does not mean the message is honest.
- **Intercepting Send.** Gmail's send action is not an API a content script can reliably intercept.
  Interfering with it risks lost or duplicated mail. Not recommended.

### Recommended design (if approved)

- **Off by default, separately enabled** in the popup, with a plain disclosure before it can be turned
  on: "When you click Check this email, Shouldn't Wouldn't reads the open message in this tab, on your
  computer, to look for requests for sensitive information. It does not read other messages, drafts,
  or attachments, and nothing is sent anywhere."
- **User-initiated only.** A "Check this email" button in the popup acts on the open Gmail message.
  No background reading, no inbox scanning, no reading of drafts or compose windows.
- **Local analysis only.** Signals: display name versus the actual sender domain; sender domain
  lookalikes (reusing the existing lookalike rules, extended with common bank, government, and
  employer patterns); Reply-To differing from From when Gmail shows it; links whose visible text names
  one domain while the link goes to another; urgent or threatening phrases; requests for SSNs,
  passwords, card numbers, codes, or gift cards; "authenticity could not be checked" whenever Gmail's
  own mailed-by/signed-by lines are not visible.
- **Before replying.** When a checked message was flagged, show a small, dismissible note above
  Gmail's reply box when the person opens it ("This email asked for sensitive information. Are you
  sure you want to respond?"). Never block, delay, send, modify, or delete mail.
- **Storage.** Nothing from the message is stored. The result disappears when the tab closes.

### Privacy, performance, compatibility, accuracy

- Privacy: this is the first feature that would read page content beyond form labels. The privacy
  policy, the store's data-use form, and the listing would all need to say so, and the Chrome Web Store
  requires prominent disclosure and consent before collecting page content.
- Performance: zero cost until the button is pressed; then one pass over one message.
- Compatibility: Gmail web only at first; expect breakage when Gmail changes its page; Outlook later.
- Accuracy: phishing text varies; keyword rules will miss well-written phishing and flag some
  legitimate messages (for example, a real bank asking a customer to call). Results must be worded as
  "signs to look at", never "this is phishing".

### Store policy risk

The Chrome Web Store requires a single, narrow purpose. A form-reminder extension that also reads email
may be judged as two purposes. Safer options: (a) a separate companion extension for email, or (b) a
Google Workspace add-on, which is the officially supported surface for per-message checks.

**Recommendation:** not in the first release. Decide between a companion extension and a Workspace
add-on. Approve the disclosure text first.

---

## 3. Online store and merchant reputation (proposal)

### What reliable sources exist

- **Google Safe Browsing API (v4)** reports known phishing and malware URLs. Google's terms limit it to
  non-commercial use, require attribution and an accuracy notice, and forbid warning on data older than
  thirty minutes; commercial use points to the paid Web Risk API. It needs an API key, which a client
  extension cannot keep secret. Chrome already runs Safe Browsing for everyone who leaves it on, so the
  extension would mostly duplicate the browser's own warning. It does not certify merchants.
- **Google "store ratings"** have no public API for looking up an arbitrary shop.
- **Trustpilot** has a documented "find business unit by domain" endpoint, but it needs an API key and
  a commercial data product; its terms on storing and redisplaying ratings were not verified here.
- **Better Business Bureau, ScamAdviser, and similar** either have no public API or charge for one.
  Scraping their public pages is not assumed to be allowed.
- **RDAP** (the successor to WHOIS) can tell how recently a domain was registered. It is public and
  free, but each lookup reveals the domain to the registry, many country domains do not support it,
  and a new domain is not proof of fraud.

### Recommended design (if approved)

- **Version A (no network, no new permissions):** on a page where the extension already shows a
  payment-card reminder, the popup offers "Shopping somewhere new? Check this seller." Choosing it
  shows the exact domain and a short list of independent places to look, each opened in a new tab only
  when the person clicks it, with the bare domain filled in: a web search for reviews of the domain,
  Trustpilot's page for the domain, the BBB search, and Google's Safe Browsing site-status page. The
  popup says, before any link is opened, that the chosen site will see the domain. The extension
  itself sends nothing.
- It can also show local signals it already has: HTTP versus HTTPS, the lookalike check, and whether
  the page links to a refund or returns policy (read from link text, locally).
- Results use the requested labels conservatively. Without real evidence the result is "Insufficient
  information", not a score. There is no universal trust score, and nothing says "safe" or "scam".
- For marketplaces (Amazon, eBay, Etsy, Walmart), the note says the platform's reputation is not the
  individual seller's, and points the person to the seller's profile on that platform.
- **Version B (network lookups)** would need: a chosen provider with permitted terms, a way to protect
  any API key (which implies a small backend, against this project's rules), a disclosure that the bare
  domain leaves the browser on each user-requested check, timeouts and offline handling, and a
  privacy-policy rewrite. Not recommended now.

### Privacy, performance, compatibility, accuracy

- Version A sends nothing by itself; the person decides to visit a review site, which then sees the
  domain as part of a normal visit.
- No background work: nothing happens until the person asks.
- Accuracy: review sites can be gamed and new honest businesses have few reviews. The interface must
  say so.

**Recommendation:** Version A could ship in a later release inside this extension, because it is
tied directly to the moment a person is about to enter card details. Version B should wait.

---

## Interface proposal (not built)

Keep the popup to one screen:

1. **Form protection** (today's content): on/off switch, page status, counts.
2. **Before you buy** (Version A of merchant check), shown only on pages with a card-number field.
3. **Email safety** (only if approved, off by default), with its own switch and the disclosure.

The core reminders keep working with the other two off.

## Sources

- Chrome Web Store Program Policies (single purpose, permissions, limited use, disclosure),
  https://developer.chrome.com/docs/webstore/program-policies/policies (page last updated 2025-05-22).
- Safe Browsing API v4 usage limits, https://developers.google.com/safe-browsing/v4/usage-limits
- Gmail API scopes (sensitive versus restricted), https://developers.google.com/workspace/gmail/api/auth/scopes
- Google Workspace add-on scopes, https://developers.google.com/workspace/add-ons/concepts/gsuite-scopes
- Trustpilot Business Units API, https://developers.trustpilot.com/business-units-api-overview/
