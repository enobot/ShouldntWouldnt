/** Local extension-storage key. The stored value is only the on/off boolean. */
export const PROTECTION_STORAGE_KEY = "protectionEnabled";

export function initialProtectionEnabled(): true {
  return true;
}

/**
 * A missing or non-boolean value means protection is on.
 * The stored value is a setting, not something typed into a form.
 */
export function protectionFromStored(value: unknown): boolean {
  return typeof value === "boolean" ? value : initialProtectionEnabled();
}
