export type WarnCategory =
  | "ssn"
  | "card"
  | "cvv"
  | "bank"
  | "routing"
  | "government-id"
  | "passport"
  | "drivers-license"
  | "license-plate"
  | "maiden-name"
  | "security-answer"
  | "password"
  | "health"
  | "dob"
  | "address"
  | "phone"
  | "email";

export type Category = WarnCategory | "none";

export type Tier = "high" | "context" | "none";

export interface FieldSnapshot {
  tag: string;
  type: string;
  name: string;
  id: string;
  autocomplete: string;
  placeholder: string;
  ariaLabel: string;
  labelText: string;
  nearbyText: string;
}

export interface Detection {
  tier: Tier;
  category: Category;
  confidence: number;
  warn: boolean;
}

export type ConcernKind = "http-page" | "http-form" | "lookalike";

export type PageStatus = "no_obvious_risks" | "caution" | "strong_concern" | "unable";

export const PAGE_STATUS_LABEL: Record<PageStatus, string> = {
  no_obvious_risks: "No obvious risks",
  caution: "Caution recommended",
  strong_concern: "Strongly indicated concern",
  unable: "Unable to determine",
};
