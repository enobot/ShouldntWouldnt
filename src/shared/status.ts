import type { PageStatus } from "./types.js";

export function statusFor(input: {
  protectionOn: boolean;
  scannable: boolean;
  sensitiveCount: number;
  concernCount: number;
}): PageStatus {
  if (!input.protectionOn || !input.scannable) return "unable";
  if (input.concernCount > 0) return "strong_concern";
  if (input.sensitiveCount > 0) return "caution";
  return "no_obvious_risks";
}
