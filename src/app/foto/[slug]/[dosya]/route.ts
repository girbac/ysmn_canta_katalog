import { readFile } from "node:fs/promises";
import path from "node:path";
import { readPhoto } from "@/lib/catalog/store-git";

/**
 * Ürün fotoğraflarının servis yolu.
 *
 * Fotoğraflar GitHub deposunda duruyor; burası onları alıp tarayıcıya
 * veriyor. Böylece yüklenen fotoğraf ANINDA görünüyor — sitenin yeniden
 * yayınlanması beklenmiyor.
 *
 * Dosya adları her yüklemede benzersiz (renk + zaman damgası + sıra), yani
 * bir adres asla başka bir görsele işaret etmiyor. O yüzden sonsuza kadar
 * önbelleğe alınabiliyor: ilk istekten sonra Vercel'in önbelleği cevap
 * veriyor, GitHub'a bir daha gidilmiyor.
 */
export async function GET(
  _istek: Request,
  { params }: { params: Promise<{ slug: string; dosya: string }> },
) {
  const { slug, dosya } = await params;

  // Yol geçişi olmasın: yalnızca düz ad ve tanınan uzantılar
  if (!/^[a-z0-9-]+$/i.test(slug) || !/^[a-z0-9._-]+\.(webp|avif|jpe?g|png)$/i.test(dosya)) {
    return new Response("Geçersiz adres", { status: 400 });
  }

  // Önce depo; orada yoksa yerel klasör (geliştirmede fotoğraflar
  // public/products altına yazılıyor, aynı adresten servis edilsinler).
  const foto = (await readPhoto(slug, dosya)) ?? (await yerelOku(slug, dosya));
  if (!foto) return new Response("Bulunamadı", { status: 404 });

  return new Response(new Uint8Array(foto.govde), {
    headers: {
      "Content-Type": foto.tur,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

async function yerelOku(
  slug: string,
  dosya: string,
): Promise<{ govde: Buffer; tur: string } | null> {
  try {
    const govde = await readFile(
      path.join(process.cwd(), "public", "products", slug, dosya),
    );
    const uzanti = dosya.split(".").pop()?.toLowerCase() ?? "";
    const turler: Record<string, string> = {
      webp: "image/webp",
      avif: "image/avif",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
    };
    return { govde, tur: turler[uzanti] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}
