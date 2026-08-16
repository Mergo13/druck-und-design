import { strict as assert } from "assert";
import { applyStudentDiscount, canApplyCouponWithStudentDiscount } from "@/lib/student-discount";
import type { ProductCatalogItem } from "@/types/print-platform";

const eligibleProduct = { studentDiscountEligible: true } as ProductCatalogItem;
const ineligibleProduct = { studentDiscountEligible: false } as ProductCatalogItem;
const verifiedUser = { studentVerification: { status: "approved" as const } };
const unverifiedUser = { studentVerification: { status: "pending" as const } };

assert.equal(applyStudentDiscount({ subtotal: 100, product: eligibleProduct, user: unverifiedUser, percent: 20 }).total, 100);
assert.equal(applyStudentDiscount({ subtotal: 100, product: eligibleProduct, user: verifiedUser, percent: 20 }).total, 80);
assert.equal(applyStudentDiscount({ subtotal: 100, product: ineligibleProduct, user: verifiedUser, percent: 20 }).total, 100);

const configuredProductTotal = 125;
assert.equal(applyStudentDiscount({ subtotal: configuredProductTotal, product: eligibleProduct, user: verifiedUser, percent: 20 }).total, 100);

const baseConfiguredPrice = 100;
const expressIncludedBeforeDiscount = baseConfiguredPrice * 1.25;
assert.equal(applyStudentDiscount({ subtotal: expressIncludedBeforeDiscount, product: eligibleProduct, user: verifiedUser, percent: 20 }).total, 100);

assert.equal(canApplyCouponWithStudentDiscount(0), true);
assert.equal(canApplyCouponWithStudentDiscount(20), false);

assert.equal(applyStudentDiscount({ subtotal: 100, product: eligibleProduct, user: unverifiedUser, percent: 20 }).total, 100);

console.log("student-discount tests passed");
