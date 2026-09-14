import type { Product } from "@/data/types";

/** Açılışta sırayla gösterilecek çanta sayısı */
const ADET = 5;

/**
 * Açılış çantalarını seçer.
 *
 * Formu farklı olanlar tercih ediliyor: birbirine benzeyen iki tote
 * arasındaki geçiş, değişimin fark edilmemesi demek olurdu.
 *
 * Sıra zamana göre kaydırılıyor. Rastgelelik istemci tarafında olsaydı
 * sayfa statik üretildiği için ilk boyamadan sonra bir sıçrama olurdu;
 * burada seçim sunucuda, üretim anında yapılıyor.
 *
 * `Date.now()` bilerek bileşenin dışında: render saf kalmalı.
 */
export function pickHeroBags(
  featured: Product[],
  all: Product[],
  /** Sıranın kaç saniyede bir kaydığı — sayfanın revalidate aralığı */
  rotasyonSaniye: number,
): Product[] {
  const set: Product[] = [];
  for (const p of [...featured, ...all]) {
    if (set.length >= ADET) break;
    if (set.some((x) => x.slug === p.slug || x.form === p.form)) continue;
    set.push(p);
  }
  if (set.length < 2) return set;

  const kayma = Math.floor(Date.now() / (rotasyonSaniye * 1000)) % set.length;
  return [...set.slice(kayma), ...set.slice(0, kayma)];
}
