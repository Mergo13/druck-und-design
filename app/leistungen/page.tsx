import { redirect } from "next/navigation";

export default async function LeistungenPage({ searchParams }: { searchParams?: Promise<{ kategorie?: string; q?: string }> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params?.kategorie) query.set("kategorie", params.kategorie);
  if (params?.q) query.set("q", params.q);

  redirect(query.size ? `/produkte?${query.toString()}` : "/produkte");
}
