import type { UserAccount } from "@/types";
import type { ProductCatalogItem } from "@/types/print-platform";

export type StudentDiscount = {
  type: "student";
  label: string;
  percent: number;
  amount: number;
};

export type DiscountedPriceResult = {
  subtotalBeforeDiscount: number;
  discounts: StudentDiscount[];
  subtotalAfterDiscount: number;
  total: number;
};

function money(value: number) {
  return Math.round(value * 100) / 100;
}

export function getStudentDiscountPercent(value?: number | null) {
  const configured = value ?? Number(process.env.STUDENT_DISCOUNT_PERCENT?.trim() || "20");
  if (!Number.isFinite(configured)) return 20;
  return Math.min(100, Math.max(0, configured));
}

export function isVerifiedStudent(user?: Pick<UserAccount, "studentVerification"> | null) {
  const verification = user?.studentVerification;
  if (verification?.status !== "approved") return false;
  if (!verification.validUntil) return true;
  const validUntil = new Date(verification.validUntil);
  if (Number.isNaN(validUntil.getTime())) return false;
  return validUntil.getTime() >= Date.now();
}

export function isStudentDiscountEligibleProduct(product: ProductCatalogItem) {
  return product.studentDiscountEligible !== false;
}

export function applyStudentDiscount(params: {
  subtotal: number;
  product?: ProductCatalogItem | null;
  user?: Pick<UserAccount, "studentVerification"> | null;
  percent?: number;
  allow?: boolean;
}): DiscountedPriceResult {
  const subtotalBeforeDiscount = money(Math.max(0, Number(params.subtotal) || 0));
  const percent = params.percent ?? getStudentDiscountPercent();
  const canApply = params.allow !== false
    && percent > 0
    && (!params.product || isStudentDiscountEligibleProduct(params.product))
    && isVerifiedStudent(params.user);
  const amount = canApply ? money(subtotalBeforeDiscount * percent / 100) : 0;
  const discounts = amount > 0
    ? [{ type: "student" as const, label: `${percent} % Studentenrabatt`, percent, amount }]
    : [];
  const subtotalAfterDiscount = money(Math.max(0, subtotalBeforeDiscount - amount));
  return {
    subtotalBeforeDiscount,
    discounts,
    subtotalAfterDiscount,
    total: subtotalAfterDiscount
  };
}

export function canApplyCouponWithStudentDiscount(studentDiscountAmount: number) {
  return money(Number(studentDiscountAmount) || 0) <= 0;
}
