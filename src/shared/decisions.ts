export function shouldPauseSubmit(input: {
  enabled: boolean;
  acknowledged: boolean;
  formHasWarnedField: boolean;
  concernCount: number;
}): boolean {
  return input.enabled && !input.acknowledged && input.formHasWarnedField && input.concernCount > 0;
}

export function shouldOfferStrongWarning(input: {
  enabled: boolean;
  acknowledged: boolean;
  focusAlreadyShown: boolean;
  trigger: "focus" | "submit";
  fieldWarned: boolean;
  concernCount: number;
}): boolean {
  if (!input.enabled || input.acknowledged || !input.fieldWarned || input.concernCount <= 0) return false;
  if (input.trigger === "focus" && input.focusAlreadyShown) return false;
  return true;
}

export function responseToWarning(action: "go-back" | "continue" | "more"): {
  acknowledge: boolean;
  resumeSubmit: boolean;
} {
  if (action === "go-back") return { acknowledge: true, resumeSubmit: false };
  if (action === "continue") return { acknowledge: true, resumeSubmit: true };
  return { acknowledge: false, resumeSubmit: false };
}
