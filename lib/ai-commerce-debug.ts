import "server-only";

export function aiCommerceDebug(stage: string, data: unknown) {
  if (process.env.NODE_ENV !== "development") return;
  console.info(`[ai-commerce:${stage}]`, JSON.stringify(data, null, 2));
}
