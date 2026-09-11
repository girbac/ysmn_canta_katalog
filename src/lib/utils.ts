export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** "{n} ürün" → "12 ürün" */
export function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (m, key) =>
    key in values ? String(values[key]) : m,
  );
}

/** Ürün ölçüsünü okunur hale getirir: 36 × 30 × 13 cm */
export function formatDimensions(d: { w: number; h: number; d: number }, cm: string) {
  return `${d.w} × ${d.h} × ${d.d} ${cm}`;
}

export function whatsappUrl(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
