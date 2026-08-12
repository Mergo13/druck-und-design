import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  orderId: z.string().min(1),
  productSlug: z.string().optional(),
  productName: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(2000)
});

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) {
    return NextResponse.json({ message: "Bitte einloggen, um eine Bewertung abzugeben." }, { status: 401 });
  }

  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Ungültige Bewertung.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const email = sessionUser.email.trim().toLowerCase();
  const order = await prisma.adminOrder.findFirst({
    where: {
      id: parsed.data.orderId,
      email,
      status: { in: ["Bezahlt", "Versendet", "In Produktion", "Neu"] }
    }
  });
  if (!order) {
    return NextResponse.json({ message: "Für diese Bestellung kann keine Bewertung abgegeben werden." }, { status: 403 });
  }

  const orderItems = Array.isArray(order.items) ? order.items as Array<Record<string, unknown>> : [];
  const productSlug = parsed.data.productSlug?.trim() || String(orderItems[0]?.productSlug ?? "");
  const productName = parsed.data.productName?.trim() || String(orderItems.find((item) => String(item.productSlug ?? "") === productSlug)?.name ?? orderItems[0]?.name ?? "");
  const duplicate = await prisma.review.findFirst({
    where: {
      email,
      orderId: order.id,
      productSlug: productSlug || null
    }
  });
  if (duplicate) {
    return NextResponse.json({ message: "Diese Bestellung wurde bereits bewertet." }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      customer: sessionUser.fullName || sessionUser.company || order.customer || email,
      email,
      orderId: order.id,
      productSlug: productSlug || null,
      productName: productName || null,
      rating: parsed.data.rating,
      comment: parsed.data.comment.trim(),
      published: false
    }
  });

  return NextResponse.json({ review, message: "Danke. Die Bewertung wartet auf Freigabe." }, { status: 201 });
}
