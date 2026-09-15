import "server-only";
import { catalogSchema } from "./schema";
import { seedProducts } from "./seed";
import type { CatalogStore } from "./store-types";

/**
 * GitHub deposu — katalogun ve fotoğrafların asıl yeri.
 *
 * Neden burası: önceki depo (Vercel Blob) Hobby planının kotasını
 * doldurdu ve erişim BİR AY kapandı. Kapanınca okumalar başarısız oldu,
 * kod tohum veriye düştü ve bir sonraki kaydetme kullanıcının bütün
 * ürünlerinin üzerine demo veriyi yazdı. Yani sorun yalnızca kota değildi:
 * kotası olan, kapanabilen bir depo bu iş için yanlış yerdi.
 *
 * GitHub deposu bu işi karşılıyor:
 *  · Ayrı bir servis, ayrı bir kota, ayrı bir fatura yok — zaten var.
 *  · Her değişiklik bir commit: geçmiş kendiliğinden tutuluyor, yedek
 *    almak diye ayrı bir iş kalmıyor, her hâle geri dönülebiliyor.
 *  · Yazmalar `sha` ile yapılıyor; arada başkası yazdıysa GitHub reddediyor.
 *    Yani "önce oku sonra tamamını yaz" yarışında veri kaybı olamıyor.
 *
 * Fotoğraflar `/foto/...` yolundan servis ediliyor (src/app/foto), yani
 * yüklendikleri anda görünüyorlar — yeni bir yayın beklenmiyor. Commit
 * mesajlarında `[skip ci]` var: veri değişikliği siteyi yeniden
 * derlemiyor.
 */

/** GITHUB_API yalnızca testte kullanılıyor; canlıda GitHub'ın kendisi */
const API = process.env.GITHUB_API || "https://api.github.com";
const CATALOG_PATH = "katalog/urunler.json";
const PHOTO_DIR = "katalog/fotograflar";
/**
 * Katalog okumasının önbellek etiketi.
 *
 * Statik sayfalar (ürün sayfaları, koleksiyon) katalogu render sırasında
 * okuyor. O okuma önbelleksiz olursa Next sayfayı statiklikten çıkarıp
 * çalışma anında hata veriyor — ölçüldü: ürün sayfası HTTP 500 dönüyordu.
 * Bu yüzden render okuması ETİKETLİ ve önbellekli; her yazmadan sonra
 * etiket tazeleniyor (bkz. mutate.ts).
 */
export const KATALOG_ETIKET = "katalog";

type Ayar = { owner: string; repo: string; branch: string; token: string };

/**
 * Sitenin yaşadığı depo.
 *
 * Vercel bu bilgiyi VERCEL_GIT_* değişkenleriyle veriyor ama bunlar çalışma
 * anında HER ZAMAN görünmüyor (projede "System Environment Variables"
 * kapalıysa gelmiyorlar). Yalnızca onlara güvenmek, anahtar doğru
 * girilmiş olsa bile "depo bağlı değil" uyarısına yol açıyordu.
 *
 * Bu yüzden değerler burada da yazılı: kurulumda girilmesi gereken tek şey
 * anahtar. Depo taşınırsa GITHUB_OWNER / GITHUB_REPO / GITHUB_BRANCH ile
 * üzerine yazılır.
 */
const VARSAYILAN = {
  owner: "girbac",
  repo: "ysmn_canta_katalog",
  branch: "claude/serene-archimedes-8wy3ve",
} as const;

export function gitAyar(): Ayar | null {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  return {
    owner: process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER || VARSAYILAN.owner,
    repo: process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG || VARSAYILAN.repo,
    branch:
      process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || VARSAYILAN.branch,
    token,
  };
}

/**
 * Bağlantının neresi eksik?
 *
 * "Depo bağlı değil" tek başına bir çıkmaz: kullanıcı neyi düzelteceğini
 * bilmiyor. Bu, panelin somut konuşabilmesi için.
 */
export function gitTanim(): {
  anahtar: boolean;
  owner: string;
  repo: string;
  branch: string;
} {
  const ayar = gitAyar();
  return {
    anahtar: Boolean(process.env.GITHUB_TOKEN),
    owner: ayar?.owner ?? VARSAYILAN.owner,
    repo: ayar?.repo ?? VARSAYILAN.repo,
    branch: ayar?.branch ?? VARSAYILAN.branch,
  };
}

function ayarZorunlu(): Ayar {
  const ayar = gitAyar();
  if (!ayar) {
    throw new Error(
      "GitHub deposu yapılandırılmamış: GITHUB_TOKEN tanımlı değil (ya da " +
        "depo adı okunamıyor). Vercel'de Settings → Environment Variables " +
        "altından ekleyin.",
    );
  }
  return ayar;
}

/**
 * `taze`: önbelleği atla.
 *
 * Yazma yolları (kaydet, fotoğraf ekle, sırala) önce okuyup sonra
 * tamamını yazıyor; bayat bir okuma üzerine yazmak veri kaybı demek. Onlar
 * her zaman taze okuyor — sunucu eylemleri zaten dinamik, sorun çıkmıyor.
 * Render okumaları ise etiketli ve önbellekli kalıyor.
 */
async function istek(
  ayar: Ayar,
  yol: string,
  secenek: RequestInit & { taze?: boolean } = {},
): Promise<Response> {
  const { taze, ...kalan } = secenek;
  return fetch(`${API}${yol}`, {
    ...kalan,
    headers: {
      Authorization: `Bearer ${ayar.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(kalan.body ? { "Content-Type": "application/json" } : {}),
      ...kalan.headers,
    },
    ...(taze || kalan.method
      ? { cache: "no-store" as const }
      : { next: { tags: [KATALOG_ETIKET] } }),
  });
}

/** Dosyayı içeriğiyle ve sha'sıyla okur; yoksa null döner */
async function dosyaOku(
  ayar: Ayar,
  yol: string,
  ref?: string,
  taze = false,
): Promise<{ metin: string; sha: string } | null> {
  const adres =
    `/repos/${ayar.owner}/${ayar.repo}/contents/${encodeURI(yol)}` +
    `?ref=${encodeURIComponent(ref ?? ayar.branch)}`;
  const cevap = await istek(ayar, adres, { taze });

  if (cevap.status === 404) return null;
  if (!cevap.ok) {
    throw new Error(`GitHub dosyayı veremedi (${cevap.status}): ${await cevap.text()}`);
  }

  const veri = (await cevap.json()) as { content?: string; sha: string };
  const metin = Buffer.from(veri.content ?? "", "base64").toString("utf8");
  return { metin, sha: veri.sha };
}

/**
 * Dosya yazar.
 *
 * `sha` verilirse GitHub yalnızca dosya hâlâ o hâldeyse yazıyor; arada
 * başkası değiştirdiyse 409 dönüyor. Bu, iki kaydetmenin birbirini
 * ezmesini imkânsız kılıyor — Blob'da böyle bir güvence yoktu.
 */
async function dosyaYaz(
  ayar: Ayar,
  yol: string,
  govde: Buffer | string,
  mesaj: string,
  sha?: string,
): Promise<void> {
  const cevap = await istek(ayar, `/repos/${ayar.owner}/${ayar.repo}/contents/${encodeURI(yol)}`, {
    method: "PUT",
    body: JSON.stringify({
      // [skip ci]: veri değişikliği sitenin yeniden derlenmesini tetiklemesin
      message: `${mesaj} [skip ci]`,
      content: Buffer.from(govde).toString("base64"),
      branch: ayar.branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (cevap.status === 409 || cevap.status === 422) {
    throw new Error(
      "Katalog arada başka bir yerden değiştirilmiş. Hiçbir şey yazılmadı — " +
        "sayfayı yenileyip tekrar deneyin.",
    );
  }
  if (!cevap.ok) {
    throw new Error(`GitHub yazamadı (${cevap.status}): ${await cevap.text()}`);
  }
}

export const gitStore: CatalogStore = {
  kind: "git",

  async probe() {
    const ayar = gitAyar();
    if (!ayar) {
      return {
        ok: false as const,
        error:
          "GITHUB_TOKEN tanımlı değil. Vercel'de Settings → Environment " +
          "Variables altına ekleyin; katalog ve fotoğraflar GitHub deposunda saklanıyor.",
      };
    }
    try {
      const cevap = await istek(ayar, `/repos/${ayar.owner}/${ayar.repo}`, { taze: true });
      if (!cevap.ok) {
        const nerede = `${ayar.owner}/${ayar.repo} (${ayar.branch})`;
        if (cevap.status === 401) {
          return {
            ok: false as const,
            error: `GitHub anahtarı kabul edilmedi (401). Anahtar yanlış ya da süresi dolmuş: ${nerede}`,
          };
        }
        if (cevap.status === 404) {
          return {
            ok: false as const,
            error:
              `${nerede} deposu anahtarla görünmüyor (404). Anahtarı üretirken ` +
              `bu depoyu seçtiğinizden ve "Repository permissions → Contents → ` +
              `Read and write" iznini verdiğinizden emin olun.`,
          };
        }
        return {
          ok: false as const,
          error: `GitHub deposuna ulaşılamıyor (${cevap.status}): ${nerede}`,
        };
      }
      return { ok: true as const };
    } catch (cause) {
      return { ok: false as const, error: (cause as Error).message };
    }
  },

  /**
   * Katalogu okur.
   *
   * Okuma hatası ASLA tohum veriye düşmez — düşmesi bir kez bütün ürünleri
   * götürdü. Yalnızca "dosya henüz yok" durumu (ilk kurulum) tohuma
   * düşüyor; bu da 404 ile kesin olarak ayırt ediliyor, tahminle değil.
   */
  async read(taze = false) {
    const dosya = await dosyaOku(ayarZorunlu(), CATALOG_PATH, undefined, taze);
    if (!dosya) return seedProducts;
    return catalogSchema.parse(JSON.parse(dosya.metin));
  },

  async readRaw() {
    const dosya = await dosyaOku(ayarZorunlu(), CATALOG_PATH);
    return dosya?.metin ?? null;
  },

  async write(products) {
    const ayar = ayarZorunlu();
    const valid = catalogSchema.parse(products);
    const govde = JSON.stringify(valid, null, 2) + "\n";

    // Mevcut sha: yazma yalnızca dosya hâlâ o hâldeyse geçiyor
    const mevcut = await dosyaOku(ayar, CATALOG_PATH, undefined, true);
    await dosyaYaz(
      ayar,
      CATALOG_PATH,
      govde,
      `Katalog güncellendi (${valid.length} ürün)`,
      mevcut?.sha,
    );
  },

  async putImage({ slug, filename, body }) {
    const ayar = ayarZorunlu();
    const yol = `${PHOTO_DIR}/${slug}/${filename}`;
    // Dosya adları her yüklemede benzersiz (renk + zaman damgası), yani
    // üzerine yazma beklenmiyor; yine de varsa sha'sı alınıyor.
    const mevcut = await dosyaOku(ayar, yol, undefined, true);
    await dosyaYaz(ayar, yol, body, `Fotoğraf: ${slug}/${filename}`, mevcut?.sha);
    return filename;
  },

  async deleteImage(source, slug) {
    const ayar = ayarZorunlu();
    // Yalnızca bu depoya ait dosya adları siliniyor; tam URL'lere dokunulmuyor
    if (/^https?:\/\//.test(source)) return;
    const dosyaAdi = source.split("/").pop() ?? source;
    const yol = `${PHOTO_DIR}/${slug}/${dosyaAdi}`;

    const mevcut = await dosyaOku(ayar, yol, undefined, true);
    if (!mevcut) return;

    await istek(ayar, `/repos/${ayar.owner}/${ayar.repo}/contents/${encodeURI(yol)}`, {
      method: "DELETE",
      body: JSON.stringify({
        message: `Fotoğraf silindi: ${slug}/${dosyaAdi} [skip ci]`,
        sha: mevcut.sha,
        branch: ayar.branch,
      }),
    });
  },

  async listImages() {
    const ayar = ayarZorunlu();
    const cevap = await istek(
      ayar,
      `/repos/${ayar.owner}/${ayar.repo}/git/trees/${encodeURIComponent(ayar.branch)}?recursive=1`,
    );
    if (!cevap.ok) return [];

    const { tree } = (await cevap.json()) as {
      tree?: Array<{ path: string; type: string }>;
    };
    return (tree ?? [])
      .filter((d) => d.type === "blob" && d.path.startsWith(`${PHOTO_DIR}/`))
      .map((d) => {
        const parca = d.path.slice(PHOTO_DIR.length + 1).split("/");
        return { slug: parca[0] ?? "", filename: parca[1] ?? "", source: parca[1] ?? "" };
      })
      .filter((g) => g.slug && g.filename);
  },

  /**
   * Yedekler = katalogun git geçmişi.
   *
   * Ayrıca yedek dosyası tutmaya gerek yok: her kaydetme zaten bir commit.
   * Geçmiş sınırsız ve ücretsiz.
   */
  async listBackups() {
    const ayar = ayarZorunlu();
    const cevap = await istek(
      ayar,
      `/repos/${ayar.owner}/${ayar.repo}/commits` +
        `?path=${encodeURIComponent(CATALOG_PATH)}&sha=${encodeURIComponent(ayar.branch)}&per_page=40`,
    );
    if (!cevap.ok) return [];

    const commitler = (await cevap.json()) as Array<{
      sha: string;
      commit: { message: string; committer: { date: string } };
    }>;
    return commitler.map((c) => ({
      key: c.sha,
      at: c.commit.committer.date,
    }));
  },

  async readBackup(key) {
    const ayar = ayarZorunlu();
    if (!/^[0-9a-f]{7,40}$/i.test(key)) throw new Error("Geçersiz sürüm.");
    const dosya = await dosyaOku(ayar, CATALOG_PATH, key);
    if (!dosya) throw new Error("Bu sürümde katalog dosyası yok.");
    return catalogSchema.parse(JSON.parse(dosya.metin));
  },
};

/** Fotoğrafı depodan ham olarak okur — /foto yolu bunu kullanıyor */
export async function readPhoto(
  slug: string,
  filename: string,
): Promise<{ govde: Buffer; tur: string } | null> {
  const ayar = gitAyar();
  if (!ayar) return null;

  const yol = `${PHOTO_DIR}/${slug}/${filename}`;
  const cevap = await istek(ayar, `/repos/${ayar.owner}/${ayar.repo}/contents/${encodeURI(yol)}`, {
    headers: { Accept: "application/vnd.github.raw" },
  });
  if (!cevap.ok) return null;

  const uzanti = filename.split(".").pop()?.toLowerCase() ?? "";
  const turler: Record<string, string> = {
    webp: "image/webp",
    avif: "image/avif",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
  };
  return {
    govde: Buffer.from(await cevap.arrayBuffer()),
    tur: turler[uzanti] ?? "application/octet-stream",
  };
}
