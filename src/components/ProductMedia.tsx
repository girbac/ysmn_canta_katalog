import Image from "next/image";
import type { Locale, Product } from "@/data/types";
import { resolveImageSource } from "@/lib/catalog/image-source";
import { BagSilhouette } from "./BagSilhouette";

/**
 * ── Fotoğraf sınırı ──
 *
 * Katalogdaki TEK yer burası: gerçek ürün fotoğrafı mı, silüet placeholder mı.
 * Renk varyantının `images` dizisi doluysa next/image ile fotoğraf basılır,
 * boşsa forma göre çizilmiş silüet gösterilir.
 *
 * Fotoğraflar geldiğinde başka hiçbir bileşen değişmez.
 * Dosya yerleşimi: public/products/<slug>/<dosya-adi>
 *
 * Çerçeve dikey (--aspect-product, bkz. globals.css): çanta fotoğrafları
 * dikey çekiliyor ve kare çerçeve üstünü altını kırpıyordu. Fotoğrafı olmayan
 * ürünlerde silüet kendi kare oranını koruyup ortalanıyor.
 */

export function ProductMedia({
  product,
  colorIndex = 0,
  imageIndex = 0,
  locale,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
  eager = false,
  contain = false,
  hoverSecond = false,
  className = "",
}: {
  product: Product;
  colorIndex?: number;
  /** Rengin kaçıncı fotoğrafı — ürün sayfasındaki galeri için */
  imageIndex?: number;
  locale: Locale;
  sizes?: string;
  priority?: boolean;
  /**
   * Görseli görünür alana girmeyi beklemeden yükler.
   *
   * Baskı görünümü için gerekli: tarayıcı yazdırırken sayfanın tamamını
   * basıyor ama tembel (lazy) görseller hiç görünür alana girmediği için
   * yüklenmiyor ve PDF'te boş kutu kalıyordu.
   */
  eager?: boolean;
  /**
   * Fotoğrafı kırpmadan, tamamı görünecek şekilde yerleştirir.
   *
   * Katalog kartlarında çantanın sapı ya da altı kırpılmasın diye açık;
   * ürün sayfasındaki büyük görselde kapalı, orada çerçeveyi doldurmak
   * daha iyi duruyor.
   */
  contain?: boolean;
  /**
   * İmleç kartın üzerine gelince rengin ikinci fotoğrafına geçer.
   *
   * İkinci fotoğraf yoksa hiç basılmıyor: boşa bir geçiş yapmak,
   * "tıklasam başka kare var" izlenimi veriyordu.
   */
  hoverSecond?: boolean;
  className?: string;
}) {
  const color = product.colors[colorIndex] ?? product.colors[0];
  const ham = color?.images?.[imageIndex] ?? color?.images?.[0];
  // Çözümlenemeyen kaynak (ör. silinmiş depodan kalma tam adres) boş döner
  const file = ham && resolveImageSource(ham, product.slug) ? ham : undefined;
  const alt = `${product.name[locale]} — ${color?.name[locale] ?? ""}`.trim();

  const ikinciHam = hoverSecond ? color?.images?.[imageIndex + 1] : undefined;
  const ikinci =
    ikinciHam && resolveImageSource(ikinciHam, product.slug) ? ikinciHam : undefined;

  /* Nefes payı görselin KENDİ dolgusu: `fill` ile basılan görsel mutlak
     konumlandığı için kapsayıcının dolgusu onu içeri almıyor, img'nin
     dolgusu ise object-fit alanını daraltıyor. */
  const oturma = contain ? "object-contain p-4 sm:p-5" : "object-cover";

  return (
    <div
      className={`relative isolate aspect-product w-full overflow-hidden rounded-tile ${contain ? "bg-ground-3" : "bg-ground-2"} ${className}`}
      style={{ contain: "paint" }}
    >
      {file ? (
        <>
          <Image
            src={resolveImageSource(file, product.slug)}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            /* priority zaten eager demek; ikisini birden vermek geçersiz */
            {...(!priority && eager ? { loading: "eager" as const } : {})}
            className={oturma}
          />
          {ikinci && (
            <Image
              src={resolveImageSource(ikinci, product.slug)}
              alt=""
              aria-hidden="true"
              fill
              sizes={sizes}
              loading="lazy"
              className={`${oturma} opacity-0 transition-opacity duration-500 group-hover/kart:opacity-100`}
            />
          )}
        </>
      ) : (
        <>
          <BagSilhouette
            form={product.form}
            hex={color?.hex ?? "#8A6A4F"}
            idSuffix={`${product.slug}-${colorIndex}`}
            /* Cosmos: kartın arka planı yok, görselin kendisi karttır.
               Stüdyo vinyeti Paper White üstünde gri leke gibi duruyordu. */
            backdrop={false}
            className="absolute inset-0 h-full w-full"
          />
          <span className="sr-only">{alt}</span>
        </>
      )}
    </div>
  );
}
