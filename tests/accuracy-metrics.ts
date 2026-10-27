import type { Category, Detection, FieldSnapshot } from "../src/shared/types.js";
import type { AccuracyCase } from "./accuracy-cases.js";

export interface CaseResult {
  id: string;
  expected: Category | "ambiguous";
  predicted: Category;
  ok: boolean;
}

export interface CategoryScore {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
}

export interface AccuracyReport {
  scored: number;
  ambiguous: number;
  ambiguousOk: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives: number;
  precision: number;
  recall: number;
  warnPrecision: number;
  warnRecall: number;
  correct: number;
  byCategory: Record<string, CategoryScore>;
  misses: CaseResult[];
}

function snapshot(partial: Partial<FieldSnapshot>): FieldSnapshot {
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

/**
 * Category-level scoring: a field counts as a true positive only when the warning names the
 * right kind of information. Warning for the wrong kind is both a false positive (for the kind
 * shown) and a false negative (for the kind missed). The warn-or-not scores ignore the kind.
 */
export function measure(cases: AccuracyCase[], classify: (field: FieldSnapshot) => Detection): AccuracyReport {
  const byCategory: Record<string, CategoryScore> = {};
  const score = (category: Category): CategoryScore => {
    byCategory[category] ??= { truePositives: 0, falsePositives: 0, falseNegatives: 0 };
    return byCategory[category];
  };
  const report: AccuracyReport = {
    scored: 0,
    ambiguous: 0,
    ambiguousOk: 0,
    truePositives: 0,
    falsePositives: 0,
    falseNegatives: 0,
    trueNegatives: 0,
    precision: 0,
    recall: 0,
    warnPrecision: 0,
    warnRecall: 0,
    correct: 0,
    byCategory,
    misses: [],
  };
  let warnTp = 0;
  let warnFp = 0;
  let warnFn = 0;
  for (const item of cases) {
    const result = classify(snapshot(item.field));
    const predicted: Category = result.warn ? result.category : "none";
    if (item.accept) {
      report.ambiguous += 1;
      const ok = item.accept.includes(predicted);
      if (ok) report.ambiguousOk += 1;
      else report.misses.push({ id: item.id, expected: "ambiguous", predicted, ok });
      continue;
    }
    const expected = item.expect ?? "none";
    report.scored += 1;
    const ok = predicted === expected;
    if (ok) report.correct += 1;
    else report.misses.push({ id: item.id, expected, predicted, ok });
    if (expected !== "none" && predicted === expected) {
      report.truePositives += 1;
      score(expected).truePositives += 1;
    }
    if (predicted !== "none" && predicted !== expected) {
      report.falsePositives += 1;
      score(predicted).falsePositives += 1;
    }
    if (expected !== "none" && predicted !== expected) {
      report.falseNegatives += 1;
      score(expected).falseNegatives += 1;
    }
    if (expected === "none" && predicted === "none") report.trueNegatives += 1;
    if (expected !== "none" && predicted !== "none") warnTp += 1;
    if (expected === "none" && predicted !== "none") warnFp += 1;
    if (expected !== "none" && predicted === "none") warnFn += 1;
  }
  const ratio = (a: number, b: number): number => (b === 0 ? 1 : a / b);
  report.precision = ratio(report.truePositives, report.truePositives + report.falsePositives);
  report.recall = ratio(report.truePositives, report.truePositives + report.falseNegatives);
  report.warnPrecision = ratio(warnTp, warnTp + warnFp);
  report.warnRecall = ratio(warnTp, warnTp + warnFn);
  return report;
}
