import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        nodeEnv: process.env.NODE_ENV,
        stripeSecretExists: !!process.env.STRIPE_SECRET_KEY,
        stripeWebhookSecretExists: !!process.env.STRIPE_WEBHOOK_SECRET,
        crmApiUrl: process.env.CRM_API_URL ?? null,
        crmApiTokenExists: !!process.env.CRM_API_TOKEN,
    });
}