import { NextResponse } from "next/server";
import { z } from "zod";
import { csvResources, csvRowsForResource, csvTemplateForResource, importCsvResource, stringifyCsv, validateCsvResource } from "@/lib/admin-csv";
import type { CsvResource, ProductImportMode, ProductImportStrategy } from "@/lib/admin-csv";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { writeAuditLog } from "@/lib/admin-audit";

type RouteContext = { params: Promise<{ resource: string }> };

function csvResponse(csv: string, filename: string) {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}

async function getResource(context: RouteContext) {
  const { resource } = await context.params;
  if (!csvResources.has(resource as CsvResource)) return null;
  return resource as CsvResource;
}

function moduleForResource(resource: CsvResource) {
  return resource === "properties" ? "products" : resource;
}

export async function GET(request: Request, context: RouteContext) {
  await ensureAdminBootstrap();
  const resource = await getResource(context);
  if (!resource) return NextResponse.json({ message: "Nicht unterstützte CSV-Ressource." }, { status: 404 });

  const permission = await requireModulePermission(moduleForResource(resource), "view");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });

  const action = new URL(request.url).searchParams.get("action") ?? "export";
  if (action === "template") {
    return csvResponse(csvTemplateForResource(resource), `${resource}-template.csv`);
  }

  const { fields, rows } = await csvRowsForResource(resource);
  return csvResponse(stringifyCsv(rows as Array<Record<string, unknown>>, fields), `${resource}-export.csv`);
}

const bodySchema = z.object({
  action: z.enum(["validate", "import"]),
  filename: z.string().max(180).optional(),
  content: z.string().min(1),
  strategy: z.enum(["skip", "update", "duplicate"]).default("update"),
  importMode: z.enum(["merge", "price-update-only", "properties-update-only", "full-replace"]).default("merge")
});

export async function POST(request: Request, context: RouteContext) {
  await ensureAdminBootstrap();
  const resource = await getResource(context);
  if (!resource) return NextResponse.json({ message: "Nicht unterstützte CSV-Ressource." }, { status: 404 });
  const body = bodySchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ message: "Ungültige CSV-Import-Anfrage.", errors: body.error.flatten() }, { status: 400 });

  if (body.data.action === "validate") {
    const permission = await requireModulePermission(moduleForResource(resource), "view");
    if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
    const validation = await validateCsvResource(resource, body.data.content, body.data.strategy as ProductImportStrategy, body.data.importMode as ProductImportMode, { includeRows: false });
    return NextResponse.json({
      delimiter: validation.delimiter,
      headers: validation.headers,
      rowCount: validation.rowCount,
      valid: validation.valid,
      warnings: validation.warnings,
      errors: validation.errors,
      preview: validation.preview
    });
  }

  const validation = await validateCsvResource(resource, body.data.content, body.data.strategy as ProductImportStrategy, body.data.importMode as ProductImportMode, { includeRows: false });
  const needsCreate = validation.rows.some((row) => row.status === "create");
  const needsUpdate = validation.rows.some((row) => row.status === "update");
  const createPermission = needsCreate ? await requireModulePermission(moduleForResource(resource), "create") : null;
  if (createPermission && !createPermission.ok) return NextResponse.json({ message: createPermission.message }, { status: createPermission.status });
  const updatePermission = needsUpdate ? await requireModulePermission(moduleForResource(resource), "update") : null;
  if (updatePermission && !updatePermission.ok) return NextResponse.json({ message: updatePermission.message }, { status: updatePermission.status });
  const actorEmail = (updatePermission?.ok ? updatePermission.sessionUser.email : createPermission?.ok ? createPermission.sessionUser.email : undefined);
  const result = await importCsvResource(resource, body.data.content, body.data.strategy as ProductImportStrategy, body.data.importMode as ProductImportMode);
  await writeAuditLog({
    actorEmail,
    module: resource,
    action: "csv-import",
    payload: {
      filename: body.data.filename,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      failed: result.failed,
      importMode: body.data.importMode
    }
  });
  return NextResponse.json(result);
}
