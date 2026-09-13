"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addAdminRecent } from "@/components/admin/admin-recents";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CatalogResource = "categories" | "properties" | "industries";
type CatalogRecord = Record<string, unknown> & { slug: string; name: string };

const resourceLabels: Record<CatalogResource, { singular: string; plural: string; api: string; listPath: string }> = {
  categories: { singular: "Kategorie", plural: "Kategorien", api: "categories", listPath: "/admin/catalog/categories" },
  properties: { singular: "Eigenschaft", plural: "Eigenschaften", api: "properties", listPath: "/admin/catalog/properties" },
  industries: { singular: "Branche", plural: "Branchen", api: "industries", listPath: "/admin/catalog/industries" }
};

type CatalogJsonEditorPageProps = {
  resource: CatalogResource;
  slug: string;
};

export function CatalogJsonEditorPage({ resource, slug }: CatalogJsonEditorPageProps) {
  const labels = resourceLabels[resource];
  const isNew = slug === "new";
  const [record, setRecord] = useState<CatalogRecord>(() => emptyRecord(resource));
  const [json, setJson] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage("");
      if (isNew) {
        const next = emptyRecord(resource);
        setRecord(next);
        setJson(JSON.stringify(next, null, 2));
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/catalog/${labels.api}/${encodeURIComponent(slug)}?scope=admin`);
      if (!response.ok) {
        setMessage(`${labels.singular} konnte nicht geladen werden.`);
      } else {
        const next = await response.json() as CatalogRecord;
        setRecord(next);
        setJson(JSON.stringify(next, null, 2));
        addAdminRecent({
          id: next.slug,
          type: labels.singular,
          label: next.name,
          href: `${labels.listPath}/${encodeURIComponent(next.slug)}`,
          subtitle: next.slug
        });
      }
      setLoading(false);
    }
    void load();
  }, [isNew, labels.api, labels.singular, resource, slug]);

  const title = useMemo(() => isNew ? `${labels.singular} anlegen` : `${labels.singular}: ${record.name || slug}`, [isNew, labels.singular, record.name, slug]);

  function update(key: "slug" | "name", value: string) {
    setRecord((current) => {
      const next = { ...current, [key]: value };
      setJson(JSON.stringify(next, null, 2));
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMessage("");
    let payload: CatalogRecord & { originalSlug?: string };
    try {
      payload = JSON.parse(json) as CatalogRecord;
    } catch {
      setSaving(false);
      setMessage("JSON ist ungültig.");
      return;
    }
    if (!isNew) payload.originalSlug = slug;
    const response = await fetch(`/api/catalog/${labels.api}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => null) as CatalogRecord | { message?: string } | null;
    setSaving(false);
    if (!response.ok) {
      const errorMessage = body && "message" in body && typeof body.message === "string" ? body.message : "Speichern fehlgeschlagen.";
      setMessage(errorMessage);
      return;
    }
    const saved = body as CatalogRecord;
    setRecord(saved);
    setJson(JSON.stringify(saved, null, 2));
    setMessage("Gespeichert.");
    if (isNew) window.history.replaceState(null, "", `${labels.listPath}/${encodeURIComponent(saved.slug)}`);
  }

  return (
    <>
      <PageHeader
        title={title}
        description="Bearbeitung über die bestehende Katalog-API. Komplexe Felder bleiben im JSON erhalten."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={labels.listPath}>
                <ArrowLeft className="h-4 w-4" />
                {labels.plural}
              </Link>
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={loading || saving}>
              <Save className="h-4 w-4" />
              {saving ? "Speichert..." : "Speichern"}
            </Button>
          </>
        }
      />
      {message ? <div className="mb-4 rounded-md border bg-white p-3 text-sm font-semibold text-slate-700">{message}</div> : null}
      <div className="grid gap-4 rounded-lg border bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase text-slate-500">Slug</span>
            <Input value={record.slug} onChange={(event) => update("slug", event.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase text-slate-500">Name</span>
            <Input value={record.name} onChange={(event) => update("name", event.target.value)} />
          </label>
        </div>
        <label className="grid gap-1.5">
          <span className="text-xs font-black uppercase text-slate-500">Vollständiges JSON</span>
          <textarea value={json} onChange={(event) => setJson(event.target.value)} className="min-h-[520px] rounded-md border bg-slate-950 p-4 font-mono text-xs text-slate-50 outline-none focus:ring-2 focus:ring-ring" spellCheck={false} />
        </label>
      </div>
    </>
  );
}

function emptyRecord(resource: CatalogResource): CatalogRecord {
  if (resource === "categories") {
    return { slug: "", name: "", description: "", visible: true, published: true, properties: [], showroomImages: [] };
  }
  if (resource === "properties") {
    return { slug: "", name: "", active: true, sortOrder: 0, values: [] };
  }
  return { slug: "", name: "", description: "", visible: true, published: true, sortOrder: 0, featured: false, productSlugs: [], serviceLinks: [], solutionGroups: [], showroomImages: [] };
}
