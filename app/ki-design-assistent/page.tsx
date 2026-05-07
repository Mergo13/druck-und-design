import type { Metadata } from "next";
import { DesignAssistant } from "@/features/ai-design/design-assistant";

export const metadata: Metadata = {
  title: "AI Design Assistant",
  description: "Briefing, Layoutvarianten, Canva-ähnlicher Editor, Upload, Print Data Check und gespeicherte Templates."
};

export default function AIAssistantPage() {
  return <DesignAssistant />;
}
