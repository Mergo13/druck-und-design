// app/api/test-crm/route.ts

import { NextResponse } from "next/server";
import { createCRMInvoice } from "@/lib/crm";
import { requireModulePermission } from "@/lib/admin-permissions";

export async function GET() {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ message: "Not found." }, { status: 404 });
    }
    const permission = await requireModulePermission("invoices", "create");
    if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
    try {
        const result = await createCRMInvoice({
            customer: "Test Customer",
            email: "test@example.com",
            total: 99.99,
            items: [
                {
                    description: "Test Product",
                    qty: 1,
                    price: 99.99,
                },
            ],
        });

        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json(
            {
                error: String(e),
                message: e instanceof Error ? e.message : null,
            },
            { status: 500 }
        );
    }
}
