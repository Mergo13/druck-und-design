import { NextResponse } from "next/server";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureAdminBootstrap();
  const { id } = await params;
  await prisma.adminOrder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
