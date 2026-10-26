import type { ConcernKind, WarnCategory } from "./types.js";

export const FIELD_COPY: Record<WarnCategory, string> = {
  ssn: "Sensitive Information: This website is requesting your Social Security number. Only share this information with organizations you trust.",
  card: "Sensitive Information: This website is requesting your card number. Make sure you recognize and trust this website.",
  cvv: "Sensitive Information: This website is requesting your card security code. Make sure you recognize and trust this website.",
  bank: "Sensitive Information: This website is requesting your bank account number. Only share this information with organizations you trust.",
  routing: "Sensitive Information: This website is requesting your bank routing number. Only share this information with organizations you trust.",
  password: "Sensitive Information: This website is requesting your password. Make sure you are on the correct website before entering it.",
  "drivers-license":
    "Sensitive Information: This website is requesting your driver's license number. Only share this information with organizations you trust.",
  passport: "Sensitive Information: This website is requesting your passport number. Only share this information with organizations you trust.",
  "government-id":
    "Sensitive Information: This website is requesting a government ID number. Only share this information with organizations you trust.",
  health:
    "Sensitive Information: This website is requesting health or medical information. Only share this information with organizations you trust.",
  email: "Reminder: This field asks for your email address. Share it only if you are comfortable hearing from this website.",
  phone: "Reminder: This field asks for your phone number. Share it only if you want this website to contact you.",
  address: "Reminder: This field asks for your address. Share it only with websites you trust.",
  dob: "Reminder: This field asks for your date of birth. That detail can be used to identify you, so share it thoughtfully.",
};

const KIND: Record<WarnCategory, string> = {
  ssn: "a Social Security number",
  card: "a card number",
  cvv: "a card security code",
  bank: "a bank account number",
  routing: "a bank routing number",
  password: "a password",
  "drivers-license": "a driver's license number",
  passport: "a passport number",
  "government-id": "a government ID number",
  health: "health or medical information",
  email: "an email address",
  phone: "a phone number",
  address: "an address",
  dob: "a date of birth",
};

const BECAUSE: Record<WarnCategory, string> = {
  ssn: "That number can be misused for identity theft, so it is worth sharing only with an organization you trust.",
  card: "A card number can be used to spend money, so make sure you recognize and trust this website.",
  cvv: "The security code helps someone charge a card, so make sure you recognize and trust this website.",
  bank: "Bank account details can move money, so share them only with an organization you trust.",
  routing: "A routing number identifies a bank, so share it only with an organization you trust.",
  password: "A password can let someone into an account, so check that you are on the correct website first.",
  "drivers-license": "A license number can be used to impersonate you, so share it only with an organization you trust.",
  passport: "A passport number is a strong identity document, so share it only with an organization you trust.",
  "government-id": "A government ID number can be used to impersonate you, so share it only with an organization you trust.",
  health: "Health details are private, so share them only with an organization you trust.",
  email: "An email address is a way for this website to contact you or to identify you.",
  phone: "A phone number is a way for this website to reach you.",
  address: "An address can identify where someone lives or receives mail.",
  dob: "A date of birth is often used to identify a person.",
};

export const HTTP_HEADLINE =
  "Potential Security Risk: This website uses an insecure connection. Information you submit could be exposed.";

export const HTTP_DETAIL =
  "This website does not use HTTPS. Information submitted over an insecure connection may be exposed.";

export const FORM_LINE = "This form appears to send information over an insecure connection.";

export const LOOKALIKE_LINE =
  "This website's address resembles another website. Double-check the URL before entering personal information.";

export function fieldCopy(category: WarnCategory): string {
  return FIELD_COPY[category];
}

export function concernLines(concerns: ConcernKind[]): string[] {
  const lines: string[] = [];
  if (concerns.includes("http-page")) lines.push(HTTP_HEADLINE);
  if (concerns.includes("http-form")) lines.push(FORM_LINE);
  if (concerns.includes("lookalike")) lines.push(LOOKALIKE_LINE);
  return lines;
}

export function whyText(category: WarnCategory, concerns: ConcernKind[]): string {
  const parts = [
    `Shouldn't Wouldn't saw signs that this field is asking for ${KIND[category]}.`,
    BECAUSE[category],
    "We do not read what you type.",
  ];
  if (concerns.length === 0) {
    parts.push(
      "Nothing else here shows a connection problem or a lookalike web address. That does not mean we checked the website's reputation.",
    );
  } else {
    parts.push(...concernLines(concerns));
    if (concerns.includes("http-page")) parts.push(HTTP_DETAIL);
  }
  parts.push(
    "If you trust this organization, you can dismiss this note and keep typing. If you do not, leave the page without entering the information.",
  );
  return parts.join(" ");
}

export function moreInformation(concerns: ConcernKind[]): string {
  const parts = [
    "This extra reminder is about the website, not about what you typed. Shouldn't Wouldn't does not read what you type.",
    "It cannot promise that a website is legitimate. HTTPS by itself does not mean a website is trustworthy.",
    ...concernLines(concerns),
  ];
  if (concerns.includes("http-page")) parts.push(HTTP_DETAIL);
  parts.push("Go back leaves this page as it is and does not clear what you already typed. Continue anyway goes ahead with the form.");
  return parts.join(" ");
}
