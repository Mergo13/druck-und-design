import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().nonnegative().max(1_000_000)
});

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Ungültiger Gutscheincode." }, { status: 400 });
  }

  const code = parsed.data.code.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  const now = new Date();
  if (!coupon || !coupon.active) {
    return NextResponse.json({ message: "Gutschein ist nicht gültig." }, { status: 404 });
  }
  if (coupon.startsAt && coupon.startsAt > now) {
    return NextResponse.json({ message: "Gutschein ist noch nicht gültig." }, { status: 400 });
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return NextResponse.json({ message: "Gutschein ist abgelaufen." }, { status: 400 });
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return NextResponse.json({ message: "Gutschein wurde bereits vollständig eingelöst." }, { status: 400 });
  }

  const discount = coupon.discountType === "percent"
    ? parsed.data.subtotal * Math.min(100, Math.max(0, coupon.discountValue)) / 100
    : coupon.discountValue;
  const discountAmount = Math.min(parsed.data.subtotal, Math.max(0, Math.round(discount * 100) / 100));

  return NextResponse.json({
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount
  });
}
