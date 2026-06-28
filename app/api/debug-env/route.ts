import { NextResponse } from "next/server";
import { requireModulePermission } from "@/lib/admin-permissions";

export async function GET() {
    const permission = await requireModulePermission("security", "view");
    if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
    return NextResponse.json({
        nodeEnv: process.env.NODE_ENV,
        stripeSecretExists: !!process.env.STRIPE_SECRET_KEY,
        stripeWebhookSecretExists: !!process.env.STRIPE_WEBHOOK_SECRET,
        crmApiConfigured: !!process.env.CRM_API_URL,
        crmApiTokenExists: !!process.env.CRM_API_TOKEN,
    });
}
