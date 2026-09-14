import Link from "next/link";
import { logout } from "../actions";

/** Panelin ortak çerçevesi: başlık, depo göstergesi, çıkış */
export function AdminShell({
  children,
  storeKind,
  storeError,
  title,
  back,
}: {
  children: React.ReactNode;
  storeKind: "fs" | "blob";
  /** Depoya erişilemiyorsa Blob'un kendi hata mesajı */
  storeError?: string;
  title: string;
  back?: { href: string; label: string };
}) {
  const inProduction = process.env.NODE_ENV === "production";

  return (
    <main className="mx-auto max-w-[1280px] px-5 py-10 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          {back && (
            <Link href={back.href} className="text-caption text-ink-60 hover:text-ink">
              ← {back.label}
            </Link>
          )}
          <h1 className="mt-1 font-whisper text-heading text-ink">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/tr" className="text-caption text-ink-60 hover:text-ink">
            Siteyi gör
          </Link>
          <span
            title={
              storeKind === "blob"
                ? "Değişiklikler Vercel Blob deposuna yazılıyor"
                : "Değişiklikler proje dosyasına yazılıyor (yerel geliştirme)"
            }
            className="rounded-card border border-line-strong px-3 py-1.5 text-caption text-ink-60"
          >
            {storeKind === "blob"
              ? storeError
                ? "Blob — erişilemiyor"
                : "Blob deposu"
              : "Yerel dosya"}
          </span>
          <form action={logout}>
            <button type="submit" className="text-caption text-ink-60 hover:text-ink">
              Çıkış
            </button>
          </form>
        </div>
      </header>

      {/* Canlıda dosya sistemi salt okunurdur — kaydetmeye çalışmadan önce uyar */}
      {storeKind === "fs" && inProduction && (
        <p
          role="alert"
          className="mt-6 rounded-card border border-line-strong bg-ground-2 p-4 text-body text-ink"
        >
          Bu ortamda Blob deposu bağlı değil, dosya sistemi ise salt okunur.
          Kaydetme işlemleri başarısız olacak. Vercel projesinde bir Blob deposu
          oluşturup projeye bağlayın, sonra yeniden yayınlayın.
        </p>
      )}

      {/* Blob bağlı görünüyor ama ulaşılamıyor: okuma hataları tohum veriyle
          örtüldüğü için bu, yazmaya çalışana kadar fark edilmiyordu. */}
      {storeError && (
        <div
          role="alert"
          className="mt-6 rounded-card border border-line-strong bg-ground-2 p-4"
        >
          <p className="text-body text-ink">
            Blob deposuna ulaşılamıyor. Kaydetme ve fotoğraf yükleme çalışmaz.
          </p>
          <p className="mt-2 text-caption text-ink-60">
            Vercel&apos;in yanıtı: <span className="text-ink">{storeError}</span>
          </p>
          <p className="mt-3 text-caption text-ink-60">
            &quot;This store does not exist&quot; diyorsa projedeki depo kimliği,
            var olmayan bir depoyu gösteriyor demektir — depo silinip yeniden
            oluşturulduysa böyle olur. Vercel&apos;de Storage bölümünden depoyu
            bu projeden ayırıp yeniden bağlayın, sonra yeniden yayınlayın.
          </p>
        </div>
      )}

      {children}
    </main>
  );
}
