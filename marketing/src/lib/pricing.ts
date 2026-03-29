export const GST_RATE = 0.18;

export type PricingMode = "course" | "subject";

export function pricingModeForCourse(courseId: string): PricingMode {
  return courseId.toLowerCase() === "cuet" ? "subject" : "course";
}

export function basePriceForCourse(courseId: string): number {
  return courseId.toLowerCase() === "ipmat" ? 2499 : 499;
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
