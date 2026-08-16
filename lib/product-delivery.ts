export function formatProductDeliveryText(deliveryText?: string, selectedDelivery?: string) {
  if (selectedDelivery === "sameday") return "Heute versandbereit";
  const normalized = deliveryText?.trim().replace(/\s*-\s*/g, "-");
  if (!normalized) return "Lieferzeit auf Anfrage";
  if (/^(lieferung|lieferzeit|versand|heute|same day)/i.test(normalized)) return normalized;
  return `Lieferung in ${normalized}`;
}
