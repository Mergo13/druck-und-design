import { createLocalSeoMetadata, LocalSeoPageView } from "@/components/local-seo-page";
import { getLocalSeoPage } from "@/lib/seo";

const page = getLocalSeoPage("textildruck-wels")!;
export const metadata = createLocalSeoMetadata(page);

export default function Page() {
  return <LocalSeoPageView page={page} />;
}
