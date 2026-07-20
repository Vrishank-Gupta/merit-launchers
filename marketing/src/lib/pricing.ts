export const GST_RATE = 0.18;

export type PricingMode = "course" | "subject";

export function pricingModeForCourse(courseId: string): PricingMode {
  const normalized = courseId.toLowerCase();
  return normalized === "cuet" || normalized === "nda" ? "subject" : "course";
}

export function basePriceForCourse(courseId: string): number {
  const normalized = courseId.toLowerCase();
  if (normalized === "ipmat") {
    return 2499;
  }
  if (normalized === "nda") {
    return 491;
  }
  return 499;
}

export function totalPriceForCourse(courseId: string): number {
  return Number((basePriceForCourse(courseId) * (1 + GST_RATE)).toFixed(2));
}

export function formatRupees(value: number): string {
  return `Rs ${value.toLocaleString("en-IN", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function pricingSummary(courseId: string): string {
  const base = formatRupees(basePriceForCourse(courseId));
  return pricingModeForCourse(courseId) === "subject"
    ? `${base}* per subject`
    : `${base}*`;
}

export function pricingTotalLabel(courseId: string): string {
  return `*GST extra`;
}
