import { promises as fs } from "fs";
import path from "path";

export type ContactLead = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  files?: Array<{
    name: string;
    url: string;
    size?: number;
    mimeType?: string;
  }>;
  createdAt: string;
  source: "contact-form";
};

const inboxPath = path.join(process.cwd(), "data", "leads-inbox.json");

async function ensureInboxFile() {
  try {
    await fs.access(inboxPath);
  } catch {
    await fs.writeFile(inboxPath, "[]\n", "utf8");
  }
}

export async function saveContactLead(lead: ContactLead) {
  await ensureInboxFile();
  const raw = await fs.readFile(inboxPath, "utf8");
  const current = JSON.parse(raw) as ContactLead[];
  const next = [lead, ...current].slice(0, 5000);
  await fs.writeFile(inboxPath, JSON.stringify(next, null, 2), "utf8");
  return lead;
}
