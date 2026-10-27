import type { Category, FieldSnapshot } from "../src/shared/types.js";

/**
 * Labeled field metadata for measuring detection. Each case imitates a common real form pattern
 * (checkout platforms, payment widgets, bank and benefits forms, sign-in pages, job applications,
 * and ordinary text boxes). Only attributes and label text are listed; no case has a typed value.
 *
 * `expect` is the one right answer. `accept` lists every answer that is reasonable for a genuinely
 * ambiguous label; those cases are reported separately and are not counted in precision or recall.
 * The set was written before the detection rules were tuned, and the same author wrote both, so
 * the numbers it produces describe this set, not the whole web.
 */
export interface AccuracyCase {
  id: string;
  field: Partial<FieldSnapshot>;
  expect?: Category;
  accept?: Category[];
  pattern: string;
}

export const ACCURACY_CASES: AccuracyCase[] = [
  // Social Security numbers
  { id: "ssn-label", field: { labelText: "Social Security number", name: "ssn" }, expect: "ssn", pattern: "benefits form" },
  { id: "ssn-abbrev", field: { labelText: "SSN", name: "ssn", placeholder: "XXX-XX-XXXX" }, expect: "ssn", pattern: "tax form" },
  { id: "ssn-last4", field: { labelText: "Last 4 digits of SSN", name: "ssn_last4" }, expect: "ssn", pattern: "identity check" },
  { id: "ssn-aria", field: { ariaLabel: "Social security number", name: "applicant.ssn" }, expect: "ssn", pattern: "single-page app" },
  { id: "ssn-aspnet", field: { labelText: "Social Security Number (SSN)", id: "txtSSN", name: "ctl00$Main$txtSSN" }, expect: "ssn", pattern: "ASP.NET form" },
  { id: "ssn-placeholder", field: { placeholder: "Social Security #", name: "field_12" }, expect: "ssn", pattern: "form builder" },
  { id: "ssn-camel", field: { name: "socialSecurityNumber" }, expect: "ssn", pattern: "camelCase name only" },
  { id: "ssn-verify", field: { labelText: "Verify your identity: last 4 of SSN", name: "verify" }, expect: "ssn", pattern: "account recovery" },
  { id: "ssn-password-type", field: { type: "password", labelText: "Social Security Number", name: "ssn" }, expect: "ssn", pattern: "site that already hides the SSN" },
  { id: "ssn-tin-either", field: { labelText: "Taxpayer ID (SSN or EIN)", name: "tin" }, accept: ["ssn", "government-id"], pattern: "contractor onboarding" },
  { id: "social-alone", field: { labelText: "Social", name: "social" }, expect: "none", pattern: "profile form" },
  { id: "social-media", field: { labelText: "Social media handle", name: "social_handle" }, expect: "none", pattern: "profile form" },
  { id: "ssn-office", field: { labelText: "Social Security office ZIP code", name: "office_zip" }, accept: ["none", "address"], pattern: "office finder" },
  { id: "ssn-benefits-question", field: { tag: "select", type: "select", labelText: "Do you receive Social Security benefits?", name: "benefits" }, expect: "none", pattern: "yes/no question" },
  { id: "ssn-nearby-email", field: { type: "email", labelText: "Email", nearbyText: "We will never ask for your Social Security number by email." }, expect: "email", pattern: "nearby disclaimer" },
  { id: "ssn-nearby-comment", field: { tag: "textarea", type: "textarea", labelText: "Comments", nearbyText: "Please do not include your Social Security number." }, expect: "none", pattern: "nearby disclaimer" },
  { id: "ssn-nearby-search", field: { type: "search", labelText: "Search", nearbyText: "Social Security benefits" }, expect: "none", pattern: "search near text" },

  // Payment cards
  { id: "card-cc-number", field: { autocomplete: "cc-number", name: "cardnumber", labelText: "Card number" }, expect: "card", pattern: "standard checkout" },
  { id: "card-shopify", field: { name: "number", autocomplete: "cc-number", labelText: "Card number" }, expect: "card", pattern: "hosted checkout" },
  { id: "card-stripe", field: { name: "cardnumber", autocomplete: "cc-number", placeholder: "1234 1234 1234 1234", ariaLabel: "Credit or debit card number" }, expect: "card", pattern: "payment widget frame" },
  { id: "card-credit-label", field: { labelText: "Credit card number", name: "cc_num" }, expect: "card", pattern: "older checkout" },
  { id: "card-debit", field: { labelText: "Debit card", name: "debit" }, expect: "card", pattern: "short label" },
  { id: "card-ccnumber-name", field: { name: "ccnumber" }, expect: "card", pattern: "name only, no separator" },
  { id: "card-id-kebab", field: { id: "credit-card-number" }, expect: "card", pattern: "id only" },
  { id: "card-no-autocomplete", field: { labelText: "Card number", autocomplete: "off", name: "field_42" }, expect: "card", pattern: "form builder" },
  { id: "card-holder", field: { labelText: "Card holder name", autocomplete: "cc-name" }, expect: "none", pattern: "checkout" },
  { id: "card-type", field: { tag: "select", type: "select", labelText: "Card type" }, expect: "none", pattern: "checkout" },
  { id: "card-expiry", field: { labelText: "Expiration date", autocomplete: "cc-exp" }, expect: "none", pattern: "checkout" },
  { id: "card-expiry-short", field: { labelText: "Expiry (MM/YY)", name: "exp" }, expect: "none", pattern: "checkout" },
  { id: "card-gift", field: { labelText: "Gift card number", name: "giftcard" }, expect: "card", pattern: "gift card redemption" },
  { id: "card-library", field: { labelText: "Library card number", name: "barcode" }, expect: "none", pattern: "library login" },
  { id: "card-loyalty", field: { labelText: "Loyalty card number", name: "loyalty" }, expect: "none", pattern: "store account" },
  { id: "card-medicare", field: { labelText: "Medicare card number", name: "mbi" }, expect: "health", pattern: "health insurance form" },
  { id: "card-gift-message", field: { tag: "textarea", type: "textarea", labelText: "Gift card message" }, expect: "none", pattern: "gift note" },
  { id: "card-pan-cookware", field: { tag: "select", type: "select", labelText: "Pan size", name: "pan_size" }, expect: "none", pattern: "cookware store" },
  { id: "card-pan-india", field: { labelText: "PAN", name: "pan" }, accept: ["card", "government-id"], pattern: "Indian tax ID or card PAN" },
  { id: "card-pin", field: { type: "password", labelText: "Card PIN" }, expect: "password", pattern: "PIN entry" },

  // Card security codes and one-time codes
  { id: "cvv-autocomplete", field: { autocomplete: "cc-csc", name: "cvc" }, expect: "cvv", pattern: "checkout" },
  { id: "cvv-label", field: { labelText: "CVV", name: "cvv" }, expect: "cvv", pattern: "checkout" },
  { id: "cvv-security-code", field: { labelText: "Security code", name: "verification_value", autocomplete: "cc-csc" }, expect: "cvv", pattern: "hosted checkout" },
  { id: "cvv-cvc", field: { labelText: "CVC", placeholder: "CVC", name: "cvc" }, expect: "cvv", pattern: "payment widget" },
  { id: "cvv-card-verification", field: { labelText: "Card verification number", name: "cvn" }, expect: "cvv", pattern: "checkout" },
  { id: "otp-security-code", field: { labelText: "Security code", name: "otc", autocomplete: "one-time-code" }, expect: "none", pattern: "sign-in code" },
  { id: "otp-sent-phone", field: { labelText: "Enter the security code we sent to your phone", name: "code" }, expect: "none", pattern: "two-step sign-in" },
  { id: "otp-verification", field: { labelText: "Verification code", autocomplete: "one-time-code" }, expect: "none", pattern: "two-step sign-in" },
  { id: "security-code-bare", field: { labelText: "Security code", name: "code" }, accept: ["cvv", "none"], pattern: "no other context" },

  // Bank accounts and routing numbers
  { id: "bank-account-number", field: { labelText: "Bank account number", name: "bank_account" }, expect: "bank", pattern: "direct deposit" },
  { id: "bank-checking", field: { labelText: "Checking account number" }, expect: "bank", pattern: "direct deposit" },
  { id: "bank-iban", field: { labelText: "IBAN", name: "iban" }, expect: "bank", pattern: "international transfer" },
  { id: "bank-account-bare", field: { labelText: "Account number", name: "accountNumber" }, accept: ["bank", "none"], pattern: "bare label" },
  { id: "bank-account-confirm", field: { labelText: "Re-enter account number", name: "account_confirm" }, accept: ["bank", "none"], pattern: "bare label" },
  { id: "bank-utility", field: { labelText: "Account number", nearbyText: "Find your account number at the top of your electric bill." }, accept: ["bank", "none"], pattern: "utility payment" },
  { id: "bank-holder", field: { labelText: "Account holder name" }, expect: "none", pattern: "direct deposit" },
  { id: "bank-name", field: { labelText: "Bank name" }, expect: "none", pattern: "direct deposit" },
  { id: "bank-name-of", field: { labelText: "Name of bank" }, expect: "none", pattern: "direct deposit" },
  { id: "bank-login-id", field: { labelText: "Username or account ID", name: "login" }, expect: "none", pattern: "sign-in" },
  { id: "routing-label", field: { labelText: "Routing number", name: "routing" }, expect: "routing", pattern: "direct deposit" },
  { id: "routing-aba", field: { labelText: "ABA routing number" }, expect: "routing", pattern: "wire form" },
  { id: "routing-camel", field: { name: "routingNumber" }, expect: "routing", pattern: "name only" },
  { id: "routing-preference", field: { tag: "select", type: "select", labelText: "Routing preference" }, expect: "none", pattern: "shipping options" },

  // Government identity documents
  { id: "dl-label", field: { labelText: "Driver's license number", name: "dl_number" }, expect: "drivers-license", pattern: "rental form" },
  { id: "dl-short", field: { labelText: "Driver License #" }, expect: "drivers-license", pattern: "rental form" },
  { id: "dl-key", field: { labelText: "License key", name: "license_key" }, expect: "none", pattern: "software activation" },
  { id: "passport-number", field: { labelText: "Passport number", name: "passport_no" }, expect: "passport", pattern: "travel booking" },
  { id: "passport-bare", field: { labelText: "Passport", name: "passport" }, expect: "passport", pattern: "travel booking" },
  { id: "gov-national", field: { labelText: "National ID number" }, expect: "government-id", pattern: "international form" },
  { id: "gov-tax-id", field: { labelText: "Tax ID", name: "taxId" }, expect: "government-id", pattern: "invoice settings" },
  { id: "gov-tin-long", field: { labelText: "Taxpayer Identification Number (TIN)" }, expect: "government-id", pattern: "tax form" },
  { id: "gov-sin", field: { labelText: "Social Insurance Number", name: "sin" }, expect: "government-id", pattern: "Canadian payroll" },
  { id: "gov-itin", field: { labelText: "ITIN" }, expect: "government-id", pattern: "tax form" },
  { id: "gov-state-id", field: { labelText: "State ID number" }, expect: "government-id", pattern: "age check" },
  { id: "id-student", field: { labelText: "Student ID", name: "student_id" }, expect: "none", pattern: "school portal" },
  { id: "id-employee", field: { labelText: "Employee ID" }, expect: "none", pattern: "HR portal" },
  { id: "id-order", field: { labelText: "Order ID" }, expect: "none", pattern: "order lookup" },

  // Passwords
  { id: "pw-current", field: { type: "password", autocomplete: "current-password", name: "password" }, expect: "password", pattern: "sign-in" },
  { id: "pw-type-only", field: { type: "password", name: "pass" }, expect: "password", pattern: "sign-in" },
  { id: "pw-plain-text", field: { type: "text", name: "password", labelText: "Password" }, expect: "password", pattern: "password shown in clear" },
  { id: "pw-pin", field: { type: "password", labelText: "PIN", name: "pin" }, expect: "password", pattern: "PIN entry" },
  { id: "pw-hint", field: { labelText: "Password hint", name: "hint" }, expect: "none", pattern: "registration" },
  { id: "pw-passcode", field: { labelText: "Passcode", name: "passcode" }, expect: "password", pattern: "device or app passcode" },
  { id: "pw-forgot-email", field: { type: "email", labelText: "Forgot your password? Enter your email" }, expect: "email", pattern: "password reset" },
  { id: "pw-confirm", field: { type: "password", autocomplete: "new-password", labelText: "Confirm password" }, expect: "password", pattern: "registration" },
  { id: "pw-account", field: { type: "password", labelText: "Account password" }, expect: "password", pattern: "sign-in" },
  { id: "pw-aspnet", field: { type: "password", name: "txtPwd" }, expect: "password", pattern: "ASP.NET sign-in" },

  // Dates of birth
  { id: "dob-label", field: { labelText: "Date of birth", name: "dob" }, expect: "dob", pattern: "registration" },
  { id: "dob-bday", field: { autocomplete: "bday", type: "date" }, expect: "dob", pattern: "registration" },
  { id: "dob-birthday", field: { labelText: "Birthday (MM/DD)" }, expect: "dob", pattern: "loyalty signup" },
  { id: "dob-year", field: { labelText: "Birth year", name: "birth_year" }, expect: "dob", pattern: "age gate" },
  { id: "date-start", field: { labelText: "Start date", type: "date" }, expect: "none", pattern: "job application" },
  { id: "date-plain", field: { labelText: "Date", type: "date" }, expect: "none", pattern: "booking" },

  // Addresses
  { id: "addr-autocomplete", field: { autocomplete: "street-address" }, expect: "address", pattern: "checkout" },
  { id: "addr-street", field: { labelText: "Street address", name: "address1" }, expect: "address", pattern: "checkout" },
  { id: "addr-bare", field: { labelText: "Address", name: "address" }, expect: "address", pattern: "checkout" },
  { id: "addr-home", field: { labelText: "Home address", name: "home_address" }, expect: "address", pattern: "registration" },
  { id: "addr-billing", field: { labelText: "Billing address", name: "billing_address" }, expect: "address", pattern: "checkout" },
  { id: "addr-shipping", field: { labelText: "Shipping address", name: "shipping_address" }, expect: "address", pattern: "checkout" },
  { id: "addr-line2", field: { labelText: "Address line 2" }, expect: "address", pattern: "checkout" },
  { id: "addr-zip", field: { labelText: "ZIP code", autocomplete: "postal-code" }, expect: "address", pattern: "checkout" },
  { id: "addr-email", field: { type: "email", labelText: "Email address" }, expect: "email", pattern: "registration" },
  { id: "addr-ip", field: { labelText: "IP address" }, expect: "none", pattern: "network settings" },
  { id: "addr-web", field: { type: "url", labelText: "Website address" }, expect: "none", pattern: "profile" },
  { id: "addr-wallet", field: { labelText: "Wallet address" }, expect: "none", pattern: "crypto exchange" },
  { id: "addr-city", field: { labelText: "City", autocomplete: "address-level2" }, expect: "none", pattern: "checkout" },

  // Phone numbers
  { id: "phone-tel", field: { type: "tel", name: "phone" }, expect: "phone", pattern: "checkout" },
  { id: "phone-mobile", field: { labelText: "Mobile number", name: "mobile" }, expect: "phone", pattern: "registration" },
  { id: "phone-cell", field: { labelText: "Cell phone" }, expect: "phone", pattern: "registration" },
  { id: "phone-national", field: { autocomplete: "tel-national" }, expect: "phone", pattern: "checkout" },
  { id: "phone-full", field: { labelText: "Mobile phone number", type: "tel", autocomplete: "tel" }, expect: "phone", pattern: "registration" },
  { id: "phone-emergency", field: { labelText: "Emergency contact phone", type: "tel" }, expect: "phone", pattern: "registration" },
  { id: "phone-model", field: { labelText: "Phone model", name: "device_model" }, expect: "none", pattern: "repair booking" },
  { id: "phone-nearby-ssn", field: { labelText: "Phone", type: "tel", nearbyText: "Your SSN will never be requested." }, expect: "phone", pattern: "nearby disclaimer" },

  // Email addresses
  { id: "email-type", field: { type: "email", name: "email" }, expect: "email", pattern: "newsletter" },
  { id: "email-work", field: { labelText: "Work email", name: "work_email" }, expect: "email", pattern: "B2B signup" },
  { id: "email-newsletter", field: { type: "email", labelText: "Newsletter", placeholder: "you@example.com" }, expect: "email", pattern: "footer signup" },
  { id: "email-or-phone", field: { labelText: "Email or phone", name: "identifier" }, accept: ["email", "phone"], pattern: "sign-in identifier" },

  // Health information
  { id: "health-conditions", field: { labelText: "Medical conditions" }, expect: "health", pattern: "intake form" },
  { id: "health-medications", field: { labelText: "Current medications" }, expect: "health", pattern: "intake form" },
  { id: "health-insurance", field: { labelText: "Health insurance member ID" }, expect: "health", pattern: "intake form" },
  { id: "health-diagnosis", field: { labelText: "Diagnosis" }, expect: "health", pattern: "intake form" },
  { id: "health-patient", field: { labelText: "Patient ID" }, expect: "health", pattern: "patient portal" },
  { id: "health-plan", field: { tag: "select", type: "select", labelText: "Health plan" }, expect: "health", pattern: "insurance form" },
  { id: "health-school", field: { labelText: "Medical school attended" }, expect: "none", pattern: "job application" },
  { id: "health-allergies", field: { labelText: "Allergies" }, accept: ["health", "none"], pattern: "event signup" },

  // Ordinary fields that should stay quiet
  { id: "plain-comments", field: { tag: "textarea", type: "textarea", labelText: "Comments", name: "comments" }, expect: "none", pattern: "contact form" },
  { id: "plain-leave-comment", field: { tag: "textarea", type: "textarea", labelText: "Leave a comment", name: "comment" }, expect: "none", pattern: "blog" },
  { id: "plain-message", field: { tag: "textarea", type: "textarea", labelText: "Message", name: "message" }, expect: "none", pattern: "contact form" },
  { id: "plain-search", field: { type: "search", name: "q", ariaLabel: "Search" }, expect: "none", pattern: "site search" },
  { id: "plain-search-password-words", field: { type: "search", placeholder: "Search help: passwords, accounts, billing" }, expect: "none", pattern: "help center search" },
  { id: "plain-username", field: { labelText: "Username", autocomplete: "username" }, expect: "none", pattern: "sign-in" },
  { id: "plain-full-name", field: { labelText: "Full name", autocomplete: "name" }, expect: "none", pattern: "registration" },
  { id: "plain-company", field: { labelText: "Company" }, expect: "none", pattern: "B2B signup" },
  { id: "plain-promo", field: { labelText: "Promo code" }, expect: "none", pattern: "checkout" },
  { id: "plain-quantity", field: { labelText: "Quantity", type: "number" }, expect: "none", pattern: "cart" },
  { id: "plain-coupon", field: { labelText: "Coupon code" }, expect: "none", pattern: "checkout" },
  { id: "plain-subject", field: { labelText: "Subject" }, expect: "none", pattern: "contact form" },
  { id: "plain-nickname", field: { labelText: "Nickname" }, expect: "none", pattern: "profile" },
  { id: "plain-title", field: { labelText: "Title" }, expect: "none", pattern: "review form" },
  { id: "plain-amount", field: { labelText: "Amount", name: "amount" }, expect: "none", pattern: "donation" },
  { id: "plain-reference", field: { labelText: "Reference number" }, expect: "none", pattern: "support form" },
  { id: "plain-confirmation", field: { labelText: "Confirmation number" }, expect: "none", pattern: "booking lookup" },
  { id: "plain-tracking", field: { labelText: "Tracking number" }, expect: "none", pattern: "package lookup" },
  { id: "plain-description-card-warning", field: { tag: "textarea", type: "textarea", labelText: "Description", nearbyText: "Do not enter credit card numbers here." }, expect: "none", pattern: "nearby disclaimer" },
  { id: "plain-search-jobs", field: { type: "search", labelText: "Search jobs", nearbyText: "Bank account" }, expect: "none", pattern: "search near text" },
  { id: "plain-account-search", field: { type: "search", labelText: "Search account settings" }, expect: "none", pattern: "settings search" },
  { id: "plain-member-number", field: { labelText: "Member number", nearbyText: "Credit union" }, accept: ["none", "bank"], pattern: "credit union sign-in" },

  // Added after the browser tests found that type="tel" (used for a number keypad) hid the real kind.
  { id: "tel-bank", field: { type: "tel", labelText: "Bank account number", name: "bank" }, expect: "bank", pattern: "mobile-friendly direct deposit" },
  { id: "tel-ssn", field: { type: "tel", labelText: "SSN", name: "ssn", placeholder: "XXX-XX-XXXX" }, expect: "ssn", pattern: "mobile-friendly benefits form" },
  { id: "tel-card", field: { type: "tel", autocomplete: "cc-number", name: "cardnumber" }, expect: "card", pattern: "mobile-friendly checkout" },
  { id: "tel-phone", field: { type: "tel", labelText: "Phone number", name: "phone" }, expect: "phone", pattern: "contact form" },

  // Added October 26, 2026, when maiden names, security answers, and license plates became kinds of their own
  // (until then the first two were expected to stay quiet). Written together with those rules, so these
  // are tuning cases, not held-out ones.
  { id: "maiden-label", field: { labelText: "Mother's maiden name" }, expect: "maiden-name", pattern: "account recovery" },
  { id: "maiden-camel", field: { name: "mothersMaidenName" }, expect: "maiden-name", pattern: "bank enrollment" },
  { id: "security-answer-label", field: { labelText: "Security question answer" }, expect: "security-answer", pattern: "account recovery" },
  { id: "security-answer-name", field: { labelText: "Answer", name: "securityAnswer1" }, expect: "security-answer", pattern: "account setup" },
  { id: "security-first-pet", field: { labelText: "What was the name of your first pet?" }, expect: "security-answer", pattern: "question as the label" },
  { id: "security-city-born", field: { labelText: "In what city were you born?" }, expect: "security-answer", pattern: "question as the label" },
  { id: "security-memorable", field: { labelText: "Memorable word" }, expect: "security-answer", pattern: "UK bank sign-in" },
  { id: "security-question-select", field: { tag: "select", type: "select-one", labelText: "Security question", name: "question1" }, expect: "none", pattern: "picking the question" },
  { id: "security-question-own", field: { labelText: "Security question" }, expect: "none", pattern: "writing your own question" },
  { id: "plate-label", field: { labelText: "License plate number", name: "plate" }, expect: "license-plate", pattern: "toll payment" },
  { id: "plate-camel", field: { name: "licensePlate" }, expect: "license-plate", pattern: "parking app" },
  { id: "plate-uk", field: { labelText: "Vehicle registration number" }, expect: "license-plate", pattern: "UK parking" },
  { id: "plate-state-select", field: { tag: "select", type: "select-one", labelText: "License plate state" }, expect: "none", pattern: "toll payment" },
  { id: "plain-plate-size", field: { labelText: "Plate size" }, expect: "none", pattern: "restaurant supply" },
  { id: "phone-code-select", field: { tag: "select", type: "select-one", labelText: "Country code", autocomplete: "tel-country-code" }, expect: "none", pattern: "phone country code drop-down" },

  // Labels in other languages, added with the multilingual rules (October 26, 2026). Written together with
  // those rules from the same drafted vocabulary, so they are tuning cases, not a held-out measure.
  { id: "es-ssn", field: { labelText: "Número de Seguro Social" }, expect: "ssn", pattern: "Spanish benefits form" },
  { id: "es-card", field: { labelText: "Número de tarjeta", autocomplete: "off" }, expect: "card", pattern: "Spanish checkout" },
  { id: "es-cvv", field: { labelText: "Código de seguridad" }, expect: "cvv", pattern: "Spanish checkout" },
  { id: "es-otp", field: { labelText: "Código de verificación" }, expect: "none", pattern: "Spanish sign-in code" },
  { id: "es-bank", field: { labelText: "Número de cuenta bancaria" }, expect: "bank", pattern: "Spanish direct deposit" },
  { id: "es-email-address", field: { labelText: "Dirección de correo electrónico" }, expect: "email", pattern: "Spanish sign-up" },
  { id: "es-address", field: { labelText: "Dirección" }, expect: "address", pattern: "Spanish shipping" },
  { id: "es-dob", field: { labelText: "Fecha de nacimiento" }, expect: "dob", pattern: "Spanish registration" },
  { id: "es-maiden", field: { labelText: "Apellido de soltera de su madre" }, expect: "maiden-name", pattern: "Spanish account recovery" },
  { id: "es-plate", field: { labelText: "Número de placa" }, expect: "license-plate", pattern: "Spanish toll payment" },
  { id: "es-comments", field: { tag: "textarea", type: "textarea", labelText: "Comentarios" }, expect: "none", pattern: "Spanish contact form" },
  { id: "zh-ssn", field: { labelText: "社会安全号码" }, expect: "ssn", pattern: "Chinese benefits form" },
  { id: "zh-card", field: { labelText: "银行卡号" }, expect: "card", pattern: "Chinese checkout" },
  { id: "zh-otp", field: { labelText: "短信验证码" }, expect: "none", pattern: "Chinese sign-in code" },
  { id: "zh-email-address", field: { labelText: "电子邮件地址" }, expect: "email", pattern: "Chinese sign-up" },
  { id: "zh-address", field: { labelText: "收货地址" }, expect: "address", pattern: "Chinese shipping" },
  { id: "zh-plate", field: { labelText: "车牌号码" }, expect: "license-plate", pattern: "Chinese parking" },
  { id: "zh-tw-id", field: { labelText: "身分證字號" }, expect: "government-id", pattern: "Taiwanese sign-up" },
  { id: "vi-ssn", field: { labelText: "Số An Sinh Xã Hội" }, expect: "ssn", pattern: "Vietnamese benefits form" },
  { id: "vi-card", field: { labelText: "Số thẻ" }, expect: "card", pattern: "Vietnamese checkout" },
  { id: "vi-dob", field: { labelText: "Ngày sinh" }, expect: "dob", pattern: "Vietnamese registration" },
  { id: "ko-card", field: { labelText: "카드번호" }, expect: "card", pattern: "Korean checkout" },
  { id: "ko-rrn", field: { labelText: "주민등록번호" }, expect: "government-id", pattern: "Korean sign-up" },
  { id: "ko-email-address", field: { labelText: "이메일 주소" }, expect: "email", pattern: "Korean sign-up" },
  { id: "ko-otp", field: { labelText: "인증번호" }, expect: "none", pattern: "Korean sign-in code" },
  { id: "ar-card", field: { labelText: "رقم البطاقة" }, expect: "card", pattern: "Arabic checkout" },
  { id: "ar-email-address", field: { labelText: "عنوان البريد الإلكتروني" }, expect: "email", pattern: "Arabic sign-up" },
  { id: "ar-dob", field: { labelText: "تاريخ الميلاد" }, expect: "dob", pattern: "Arabic registration" },
  { id: "fr-card", field: { labelText: "Numéro de carte" }, expect: "card", pattern: "French checkout" },
  { id: "fr-maiden", field: { labelText: "Nom de jeune fille de votre mère" }, expect: "maiden-name", pattern: "French account recovery" },
  { id: "fr-dob", field: { labelText: "Date de naissance" }, expect: "dob", pattern: "French registration" },
  { id: "ru-card", field: { labelText: "Номер карты" }, expect: "card", pattern: "Russian checkout" },
  { id: "ru-email-address", field: { labelText: "Адрес электронной почты" }, expect: "email", pattern: "Russian sign-up" },
  { id: "ru-maiden", field: { labelText: "Девичья фамилия матери" }, expect: "maiden-name", pattern: "Russian account recovery" },
  { id: "ru-otp", field: { labelText: "Код подтверждения" }, expect: "none", pattern: "Russian sign-in code" },
  { id: "pt-cpf", field: { labelText: "CPF" }, expect: "government-id", pattern: "Brazilian checkout" },
  { id: "pt-card", field: { labelText: "Número do cartão" }, expect: "card", pattern: "Portuguese checkout" },
  { id: "pt-postal", field: { labelText: "CEP" }, expect: "address", pattern: "Brazilian shipping" },
  { id: "ht-ssn", field: { labelText: "Nimewo Sekirite Sosyal" }, expect: "ssn", pattern: "Haitian Creole benefits form" },
  { id: "ht-dob", field: { labelText: "Dat nesans" }, expect: "dob", pattern: "Haitian Creole registration" },
  { id: "tl-dob", field: { labelText: "Petsa ng kapanganakan" }, expect: "dob", pattern: "Tagalog registration" },
  { id: "tl-phone", field: { labelText: "Numero ng telepono" }, expect: "phone", pattern: "Tagalog contact form" },
];
