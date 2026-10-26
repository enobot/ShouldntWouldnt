/**
 * How many times one reminder may be put back during a short burst.
 * A tight delete-and-repair loop stops here. A quiet gap opens a new burst,
 * which is enough for an ordinary page that redraws a form now and then.
 * This is not a promise that a hostile page cannot hide the note.
 */
export const MAX_REPAIR_BURST = 5;

/** Quiet time after which a later removal may be repaired again. */
export const REPAIR_BURST_MS = 10_000;

export interface RepairBudget {
  used: number;
  burstStartedAt: number;
}

export function freshRepairBudget(): RepairBudget {
  return { used: 0, burstStartedAt: 0 };
}

export function consumeRepair(
  budget: RepairBudget,
  now: number,
): { allow: boolean; budget: RepairBudget } {
  const quiet = budget.burstStartedAt === 0 || now - budget.burstStartedAt >= REPAIR_BURST_MS;
  const used = quiet ? 0 : budget.used;
  const burstStartedAt = quiet ? now : budget.burstStartedAt;
  if (used >= MAX_REPAIR_BURST) {
    return { allow: false, budget: { used, burstStartedAt } };
  }
  return { allow: true, budget: { used: used + 1, burstStartedAt } };
}
