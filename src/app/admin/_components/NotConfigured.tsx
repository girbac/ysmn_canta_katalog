/**
 * ADMIN_PASSWORD tanımlı değilken gösterilir.
 *
 * Panelin varsayılanı "kapalı": şifre yoksa hiçbir yönetim ekranı
 * açılmıyor, yanlışlıkla herkese açık bir panel bırakma riski olmuyor.
 */
export function NotConfigured() {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="max-w-md">
        <h1 className="font-whisper text-heading text-ink">Panel kapalı</h1>
        <p className="mt-4 text-body text-ink-60">
          Yönetim paneli bir şifre tanımlanmadan açılmaz. Sunucu ortamına şu
          değişkenleri ekleyip yeniden yayınlayın:
        </p>
        <pre className="mt-5 overflow-x-auto rounded-card border border-line bg-ground-2 p-4 text-caption text-ink">
{`ADMIN_PASSWORD=en-az-8-karakter
ADMIN_SECRET=rastgele-uzun-bir-dize`}
        </pre>
        <p className="mt-4 text-caption text-ink-40">
          ADMIN_SECRET zorunlu değil ama verilmesi tercih edilir; verilmezse
          imza anahtarı şifreden türetilir.
        </p>
      </div>
    </main>
  );
}
