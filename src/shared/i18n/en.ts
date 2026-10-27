import type { UiStrings } from "./strings.js";

// "Appears to be asking" because the extension reads labels, not the site's intent, and labels can mislead.
export const en: UiStrings = {
  sentenceJoiner: " ",
  field: {
    ssn: "Sensitive Information: This website appears to be asking for your Social Security number. Only share this information with organizations you trust.",
    card: "Sensitive Information: This website appears to be asking for your card number. Make sure you recognize and trust this website.",
    cvv: "Sensitive Information: This website appears to be asking for your card security code. Make sure you recognize and trust this website.",
    bank: "Sensitive Information: This website appears to be asking for your bank account number. Only share this information with organizations you trust.",
    routing: "Sensitive Information: This website appears to be asking for your bank routing number. Only share this information with organizations you trust.",
    password: "Sensitive Information: This website appears to be asking for your password. Make sure you are on the correct website before entering it.",
    "drivers-license":
      "Sensitive Information: This website appears to be asking for your driver's license number. Only share this information with organizations you trust.",
    passport: "Sensitive Information: This website appears to be asking for your passport number. Only share this information with organizations you trust.",
    "license-plate":
      "Sensitive Information: This website appears to be asking for your license plate number. Only share this information with organizations you trust.",
    "maiden-name":
      "Sensitive Information: This website appears to be asking for a maiden name. Only share this information with organizations you trust.",
    "security-answer":
      "Sensitive Information: This website appears to be asking for the answer to a security question. Make sure you recognize and trust this website.",
    "government-id":
      "Sensitive Information: This website appears to be asking for a government ID number. Only share this information with organizations you trust.",
    health:
      "Sensitive Information: This website appears to be asking for health or medical information. Only share this information with organizations you trust.",
    email: "Reminder: This field asks for your email address. Share it only if you are comfortable hearing from this website.",
    phone: "Reminder: This field asks for your phone number. Share it only if you want this website to contact you.",
    address: "Reminder: This field asks for your address. Share it only with websites you trust.",
    dob: "Reminder: This field asks for your date of birth. That detail can be used to identify you, so share it thoughtfully.",
  },
  sawSigns: {
    ssn: "Shouldn't Wouldn't saw signs that this field is asking for a Social Security number.",
    card: "Shouldn't Wouldn't saw signs that this field is asking for a card number.",
    cvv: "Shouldn't Wouldn't saw signs that this field is asking for a card security code.",
    bank: "Shouldn't Wouldn't saw signs that this field is asking for a bank account number.",
    routing: "Shouldn't Wouldn't saw signs that this field is asking for a bank routing number.",
    password: "Shouldn't Wouldn't saw signs that this field is asking for a password.",
    "drivers-license": "Shouldn't Wouldn't saw signs that this field is asking for a driver's license number.",
    passport: "Shouldn't Wouldn't saw signs that this field is asking for a passport number.",
    "license-plate": "Shouldn't Wouldn't saw signs that this field is asking for a license plate number.",
    "maiden-name": "Shouldn't Wouldn't saw signs that this field is asking for a maiden name.",
    "security-answer": "Shouldn't Wouldn't saw signs that this field is asking for the answer to a security question.",
    "government-id": "Shouldn't Wouldn't saw signs that this field is asking for a government ID number.",
    health: "Shouldn't Wouldn't saw signs that this field is asking for health or medical information.",
    email: "Shouldn't Wouldn't saw signs that this field is asking for an email address.",
    phone: "Shouldn't Wouldn't saw signs that this field is asking for a phone number.",
    address: "Shouldn't Wouldn't saw signs that this field is asking for an address.",
    dob: "Shouldn't Wouldn't saw signs that this field is asking for a date of birth.",
  },
  because: {
    ssn: "That number can be misused for identity theft, so it is worth sharing only with an organization you trust.",
    card: "A card number can be used to spend money, so make sure you recognize and trust this website.",
    cvv: "The security code helps someone charge a card, so make sure you recognize and trust this website.",
    bank: "Bank account details can move money, so share them only with an organization you trust.",
    routing: "A routing number identifies a bank, so share it only with an organization you trust.",
    password: "A password can let someone into an account, so check that you are on the correct website first.",
    "drivers-license": "A license number can be used to impersonate you, so share it only with an organization you trust.",
    passport: "A passport number is a strong identity document, so share it only with an organization you trust.",
    "license-plate": "A license plate links you to your vehicle, so share it only with an organization you trust.",
    "maiden-name":
      "Banks and other accounts often use a maiden name to confirm who you are or to reset a password, so share it only with an organization you trust.",
    "security-answer":
      "Security answers can let someone reset your passwords and get into your accounts, so check that you are on the correct website first.",
    "government-id": "A government ID number can be used to impersonate you, so share it only with an organization you trust.",
    health: "Health details are private, so share them only with an organization you trust.",
    email: "An email address is a way for this website to contact you or to identify you.",
    phone: "A phone number is a way for this website to reach you.",
    address: "An address can identify where someone lives or receives mail.",
    dob: "A date of birth is often used to identify a person.",
  },
  weDoNotRead: "We do not read what you type.",
  noOtherSigns:
    "Nothing else here shows a connection problem or a lookalike web address. That does not mean we checked the website's reputation.",
  trustOrLeave:
    "If you trust this organization, you can dismiss this note and keep typing. If you do not, leave the page without entering the information.",

  httpHeadline: "Potential Security Risk: This website uses an insecure connection. Information you submit could be exposed.",
  httpDetail: "This website does not use HTTPS. Information submitted over an insecure connection may be exposed.",
  formLine: "This form appears to send information over an insecure connection.",
  lookalikeLine: "This website's address resembles another website. Double-check the URL before entering personal information.",
  maskLine:
    "To keep it off your screen, what you type here shows as dots. Choose Show to see it. This only changes your screen. The website still receives what you enter.",
  moreAbout: "This extra reminder is about the website, not about what you typed. Shouldn't Wouldn't does not read what you type.",
  cannotPromise: "It cannot promise that a website is legitimate. HTTPS by itself does not mean a website is trustworthy.",
  goBackExplained: "Go back leaves this page as it is and does not clear what you already typed. Continue anyway goes ahead with the form.",

  show: "Show",
  hide: "Hide",
  showName: "Show what you typed in this field",
  hideName: "Hide what you typed in this field",
  why: "Why am I seeing this?",
  dismiss: "Dismiss",
  dismissName: "Dismiss this reminder",
  noteName: "Shouldn't Wouldn't reminder",
  goBack: "Go Back",
  continueAnyway: "Continue Anyway",
  moreInformation: "More Information",
  panelName: "Shouldn't Wouldn't site reminder",

  hiddenReminderLine: "This page removed or covered a Shouldn't Wouldn't reminder. Look carefully before you share anything here.",
  toolbarHiddenTitle: "Shouldn't Wouldn't: this page removed or covered a reminder",

  tagline: "Think Twice Before You Share.",
  protection: "Protection",
  on: "On",
  off: "Off",
  offExplained:
    "If you turn protection off, scanning stops until you turn it back on. That choice is saved in this browser profile. It stays off when you change pages, refresh, or close Chrome. It is not sent to us.",
  notAVerdict: "This is not a verdict that the website is legitimate.",
  site: "Site",
  connection: "Connection",
  sensitiveFields: "Sensitive fields",
  securityConcerns: "Security concerns",
  offNotScanned: "Protection is off right now, so this page was not scanned.",
  status: {
    no_obvious_risks: "No obvious risks",
    caution: "Caution recommended",
    strong_concern: "Strongly indicated concern",
    unable: "Unable to determine",
  },
  privacyTitle: "Your Privacy Matters",
  privacyBody: [
    "Shouldn't Wouldn't was created to help you and your loved ones browse with greater confidence.",
    "We don't read what you type into forms.",
    "We don't collect, save, share, or sell your personal information.",
    "Our extension simply identifies sensitive information requests and potential security concerns, then gives you a gentle reminder to think twice before sharing.",
    "Form analysis happens locally in your browser, without tracking your activity.",
    "Because your privacy should always come first.",
  ],
  privacyLimit:
    "Shouldn't Wouldn't cannot guarantee that every website is safe. A website can still hide, cover, or remove a reminder, and this extension cannot stop a site that is trying to do that. Websites you choose to submit information to may collect that information under their own privacy policies.",
  language: "Language",
  languageAuto: "Browser language",

  welcomeChoose: "Choose your language",
  welcomeDone: "Reminders will appear in English. You can change the language at any time from the Shouldn't Wouldn't button in the toolbar.",
  welcomeIntro:
    "When a website asks for something sensitive, like a Social Security or card number, a short note will appear next to that field. Shouldn't Wouldn't does not read what you type.",
  welcomeClose: "You can close this tab.",
};
