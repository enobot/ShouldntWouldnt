import type { FieldSnapshot } from "../src/shared/types.js";

export function field(partial: Partial<FieldSnapshot> = {}): FieldSnapshot {
  return {
    tag: "input",
    type: "text",
    name: "",
    id: "",
    autocomplete: "",
    placeholder: "",
    ariaLabel: "",
    labelText: "",
    nearbyText: "",
    ...partial,
  };
}
