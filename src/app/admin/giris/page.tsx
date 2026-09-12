import { redirect } from "next/navigation";
import { isAdmin, isAdminConfigured } from "@/lib/admin-session";
import { login } from "../actions";
import { NotConfigured } from "../_components/NotConfigured";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ devam?: string; hata?: string }>;
}) {
  if (!isAdminConfigured()) return <NotConfigured />;
  if (await isAdmin()) redirect("/admin");

  const { devam, hata } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm">
        <h1 className="font-whisper text-heading text-ink">Yönetim</h1>
        <p className="mt-2 text-body text-ink-60">Katalogu düzenlemek için giriş yapın.</p>

        <form action={login} className="mt-8">
          <input type="hidden" name="devam" value={devam ?? "/admin"} />

          <label className="block">
            <span className="eyebrow text-ink-40">Şifre</span>
            <input
              type="password"
              name="sifre"
              autoComplete="current-password"
              autoFocus
              required
              className="mt-2 w-full rounded-card border border-line-strong bg-ground-2 px-4 py-3 text-body text-ink focus:border-ink focus:outline-none"
            />
          </label>

          {hata && (
            <p role="alert" className="mt-3 text-caption text-ink">
              Şifre hatalı.
            </p>
          )}

          <button
            type="submit"
            className="mt-6 w-full rounded-card bg-ink px-6 py-4 text-body font-medium text-ground"
          >
            Gir
          </button>
        </form>
      </div>
    </main>
  );
}
