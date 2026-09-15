"use client";

import { useActionState } from "react";
import { restoreCatalogAction, type RestoreState } from "../actions";

/**
 * Geri yükleme düğmesi.
 *
 * Katalogun üzerine yazan tek düğme bu, o yüzden onay istiyor: yanlış
 * tıklamayla bir katalogun gitmesi tam da bu ekranın var olma sebebi.
 */
export function RestoreForm({
  kaynak,
  yedek,
  etiket,
  uyari,
}: {
  kaynak: "yedek" | "fotograf" | "ham";
  yedek?: string;
  etiket: string;
  uyari?: string;
}) {
  const [state, action, pending] = useActionState<RestoreState | null, FormData>(
    restoreCatalogAction,
    null,
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const onay = window.confirm(
          `${etiket}?\n\nŞu anki katalogun yerine bu liste yazılacak. Mevcut hâl önce yedeklenir, istersen geri dönebilirsin.`,
        );
        if (!onay) e.preventDefault();
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <input type="hidden" name="kaynak" value={kaynak} />
      {yedek && <input type="hidden" name="yedek" value={yedek} />}
      <button
        type="submit"
        disabled={pending}
        className="rounded-card border border-line-strong bg-ground-2 px-4 py-2 text-caption font-medium text-ink disabled:opacity-50"
      >
        {pending ? "Geri yükleniyor…" : etiket}
      </button>
      {uyari && !state && <span className="text-caption text-ink-60">{uyari}</span>}
      {state?.ok && (
        <span className="text-caption text-ink">
          {state.adet} ürün geri yüklendi.
        </span>
      )}
      {state && !state.ok && (
        <span role="alert" className="text-caption text-ink">
          {state.error}
        </span>
      )}
    </form>
  );
}
