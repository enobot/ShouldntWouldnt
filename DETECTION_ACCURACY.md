# Detection accuracy

Shouldn't Wouldn't decides whether a form field is asking for something sensitive from the field's
metadata only: the control type, `name`, `id`, autocomplete token, placeholder, label text, ARIA
label, and a short clip of nearby description. It never reads what a person types. Rules live in
[src/shared/detect.ts](src/shared/detect.ts). This page reports how well those rules do on a labeled
set of field examples, before and after this audit's changes.

## How it was measured

- **Data:** [tests/accuracy-cases.ts](tests/accuracy-cases.ts) (151 cases at the audit, 164 since 0.1.3, the *tuning set*) and
  [tests/accuracy-holdout.ts](tests/accuracy-holdout.ts) (54 cases, the *held-out set*). Each case is
  the metadata of one realistic field, written to imitate common patterns: hosted checkouts, payment
  widgets, direct-deposit and benefits forms, sign-in and two-step pages, job and health intake forms,
  and ordinary boxes such as comments and search. No case contains a typed value.
- **Labels:** each case has one right answer (`expect`), or, for genuinely ambiguous labels such as a
  bare "Account number", a list of acceptable answers (`accept`). Ambiguous cases are reported on their
  own and are not counted in precision or recall.
- **Scoring:** a true positive needs the warning to name the right kind of information. Warning for the
  wrong kind counts as a false positive for the kind shown and a false negative for the kind missed.
  The warn/no-warn scores ignore the kind.
- **Tool:** `npm run accuracy` (or `node scripts/accuracy.mjs <build dir>` for another build). The
  "before" numbers come from the original commit `8b2b2ec`, built unchanged.

### What the numbers can and cannot tell you

The same person wrote the cases and the rules. The tuning set was written *before* the rules were
changed, then used to change them, so its "after" score is optimistic by construction. The held-out set
was written *after* tuning, with wording the tuning set does not use, and its first measurement is the
more honest figure. Neither set is a sample of the web. Real false-positive and false-negative rates on
live sites are unknown, and no percentage here should be read as one.

Four tuning cases (`tel-*`) were added after the real-browser tests found that `type="tel"` hid the real
kind of a bank-account field. They are marked in the file.

## Results

Version 0.1.3 (October 26, 2026) added maiden names, security answers, and license plates, and 13
tuning cases for them (two of which used to expect no warning). Those cases were written together with
the new rules, so they are tuning cases. With them the tuning set is 164 cases (154 scored, 10
ambiguous), all 154 correct; the held-out set is unchanged at 43 of 43. The tables below are the
original audit's.

### Tuning set (151 cases: 141 scored, 10 ambiguous)

| | Before (`8b2b2ec`) | After |
| --- | --- | --- |
| Correct (scored) | 119 / 141 | 141 / 141 |
| True positives / false positives / false negatives | 70 / 12 / 14 | 84 / 0 / 0 |
| Category precision | 85.4% | 100% (tuned on this set) |
| Category recall | 83.3% | 100% (tuned on this set) |
| Warn/no-warn precision | 90.2% | 100% |
| Warn/no-warn recall | 88.1% | 100% |
| Ambiguous answered acceptably | 9 / 10 | 10 / 10 |

### Held-out set (54 cases: 43 scored, 11 ambiguous)

| | Before (`8b2b2ec`) | After, first measurement | After two follow-up fixes |
| --- | --- | --- | --- |
| Correct (scored) | 34 / 43 | 41 / 43 | 43 / 43 |
| True positives / false positives / false negatives | 24 / 6 / 3 | 25 / 0 / 2 | 27 / 0 / 0 |
| Category precision | 80.0% | 100% | 100% |
| Category recall | 88.9% | 92.6% | 100% |

The two held-out misses at first measurement were "Soc. Sec. No." and a card security code labeled
only "CSC". Both were then added to the rules. After that change the held-out set is no longer fully
held out, which is why the first measurement is listed.

### By kind, tuning set

| Kind | Before TP / FP / FN | After TP / FP / FN |
| --- | --- | --- |
| Social Security number | 8 / 1 / 2 | 10 / 0 / 0 |
| Card number | 9 / 4 / 1 | 10 / 0 / 0 |
| Card security code | 5 / 2 / 0 | 5 / 0 / 0 |
| Bank account | 3 / 0 / 1 | 4 / 0 / 0 |
| Routing number | 3 / 0 / 0 | 3 / 0 / 0 |
| Government ID | 3 / 0 / 3 | 6 / 0 / 0 |
| Passport | 2 / 0 / 0 | 2 / 0 / 0 |
| Driver's license | 2 / 0 / 0 | 2 / 0 / 0 |
| Password | 8 / 1 / 1 | 9 / 0 / 0 |
| Health | 5 / 1 / 2 | 7 / 0 / 0 |
| Date of birth | 3 / 0 / 1 | 4 / 0 / 0 |
| Address | 5 / 0 / 3 | 8 / 0 / 0 |
| Phone | 8 / 3 / 0 | 8 / 0 / 0 |
| Email | 6 / 0 / 0 | 6 / 0 / 0 |

Every row is copied from `scripts/accuracy.mjs` output for the two builds.

## False positives found and fixed

| Case | Before | Cause | Fix |
| --- | --- | --- | --- |
| "Enter the security code we sent to your phone" | Card security code | "security code" alone meant CVV | Sign-in and verification codes (`autocomplete="one-time-code"`, "sent", "authenticator", "two-step", "verification code") are recognized and stay quiet |
| `autocomplete="one-time-code"` labeled "Security code" | Card security code | same | same |
| "Library card number", "Loyalty card number", "Membership card number" | Card number | any "card number" counted | Library, loyalty, membership, student, ID, insurance, and similar cards are excluded |
| "Medicare card number" | Card number | same | Medicare and Medicaid count as health information |
| "Pan size" (a cookware drop-down) | Card number | the word "pan" alone | "PAN" counts only as the whole label or "PAN number"; drop-downs never get number warnings |
| "Do you receive Social Security benefits?" (drop-down) | SSN | any mention of "Social Security" | Benefits, office, administration, income, and similar wording are excluded; drop-downs cannot hold a typed number |
| "Have you lost your Social Security card?" (drop-down) | SSN | same | same |
| "Passport issuing country" (drop-down) | Passport | same | drop-down rule |
| "Phone model", "Phone type" | Phone | any "phone" | model, type, brand, carrier and similar words are excluded |
| "Medical school attended", "Medical device serial number" | Health | any "medical" | school, degree, device, supplies and similar words are excluded |
| Search box "Search by ZIP code" | Address | placeholder text on a search box | search boxes never warn |

## False negatives found and fixed

| Case | Before | Fix |
| --- | --- | --- |
| "Home address", "Billing address", "Shipping address", "Residential address" | Missed | Any label with "address" counts, except email, IP, MAC, web, URL, wallet, and similar addresses |
| SSN in a `type="password"` box | Shown as "password" | A specific identity or payment label beats the password type |
| Bank account / SSN / card in a `type="tel"` box | Shown as "phone" | A specific identity or payment label beats the tel type (sites use tel for a number keypad) |
| `name="ccnumber"`, `name="cardNumber"` | Missed | `cc`/`card` + `num`/`number`/`no` joined together count |
| "Taxpayer Identification Number", "Social Insurance Number", "State ID number" | Missed | Added to government ID |
| "Passcode" | Missed | Counts as a password |
| "Birth year" | Missed | Birth year, month, and day count as date of birth |
| "Current medications", "Prescription number" | Missed | Plural forms count |
| "Soc. Sec. No.", "CSC" | Missed (held-out) | Added |

## Ambiguous labels and how they are handled

- **"Account number" alone** warns as a bank account. It might be a utility or loyalty account. The
  wording now says the site "appears to be asking for" a bank account number.
- **"Security code" with no other context** warns as a card security code.
- **"PAN"** warns as a card number. In India it is also a tax ID.
- **"Email or phone"** warns as email.
- **"Allergies"** and **"Describe your symptoms"** stay quiet. They are health information, but the
  rules only warn on explicit medical, diagnosis, medication, prescription, patient, Medicare/Medicaid,
  and health-plan wording.

## Distinguishing a legitimate request from a fraudulent one

The extension cannot tell a bank that legitimately asks for an account number from a fake site that
asks for the same thing. The two forms can be identical. What it can do is say, plainly, that this
field appears to ask for something sensitive and that the person should be sure they trust the site.
The three local site signals (HTTP page, HTTP form action, conservative lookalike hostname) add a
second note only when present, and none of them is a verdict about the site. "No obvious risks" in
the popup means only that these checks found nothing.

## In-page checks (real browser)

The rules are also exercised on real pages in Chromium (`npm run test:browser`):

- [fixtures/misleading-context.html](fixtures/misleading-context.html): a page whose text, legend, and
  search hint all mention Social Security, card, and bank numbers. None of its fields is marked.
- [fixtures/privacy-probe.html](fixtures/privacy-probe.html): an editable region that says "Social
  Security number" next to a field, and a label made of editable text, no longer mark their fields; the
  original build marked the second one (and a drop-down whose option said "Social Security number").
- [fixtures/ssn.html](fixtures/ssn.html), [fixtures/dynamic.html](fixtures/dynamic.html),
  [fixtures/spa.html](fixtures/spa.html), [fixtures/perf/react-app.html](fixtures/perf/react-app.html),
  and [fixtures/perf/lazy-components.html](fixtures/perf/lazy-components.html) (open and closed shadow
  roots in custom elements).

## Known limitations

- Rules, not a model. Labels that do not resemble the patterns are missed, and new wording needs a rule.
- English only.
- Fields inside cross-origin frames get their own content script only when that frame's address is
  `http` or `https`, and the parent page cannot see them.
- Closed shadow roots are looked up only on custom elements (names with a hyphen). A closed root on a
  plain built-in element is not scanned. This was a deliberate trade for speed on large pages; see
  [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md).
- Custom controls that are not `input`, `textarea`, or `select` (for example a canvas or a `div` that
  draws its own text box) are not recognized.
- Sign-in codes are deliberately not warned about. Since 0.1.3 the answer to a security question is
  ("Security answer", or the question itself as the label, such as "What was the name of your first
  pet?"); the drop-down that picks the question is not, and an answer box labeled only "Answer" with no
  security wording in its name or id is missed.
- Since 0.1.3, email, password, and phone fields are classified as before but get a reminder only on a
  page loaded over HTTP, a form that submits over HTTP, or a lookalike address. That rule lives in the
  content script, not in the classifier these numbers measure.
