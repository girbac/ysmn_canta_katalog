"use client";

import { useState } from "react";
import { FALLBACK_HEX, colorKeyFromName, presetColors, type ColorDef } from "@/data/colors";

/**
 * Renk seçimi.
 *
 * Palet kapalı bir liste değil: aşağıdaki hazır renkler yalnızca kısayol,
 * istenen ada ve tona sahip yeni bir renk her zaman eklenebiliyor. Ürün
 * rengi kendi içinde sakladığı için (anahtar + ad + hex) palet dışı bir
 * renk katalogda her yerde doğru görünüyor: kartta, filtrede, PDF'te.
 *
 * Seçili bir rengin yuvarlağı aynı zamanda bir renk kutusu — tonu
 * beğenilmediyse adı yeniden yazmaya gerek yok.
 */
export function ColorPicker({
  selected,
  onToggle,
  onAdd,
}: {
  /** Sıraya girmiş hâliyle seçili renkler — ilki kapak */
  selected: ColorDef[];
  onToggle: (color: ColorDef) => void;
  /** Yeni renk ekler ya da var olanın tonunu yerinde günceller */
  onAdd: (color: ColorDef) => void;
}) {
  const [ad, setAd] = useState("");
  const [ton, setTon] = useState(FALLBACK_HEX);
  const [uyari, setUyari] = useState<string | null>(null);

  const seciliAnahtarlar = new Set(selected.map((c) => c.key));

  function ekle() {
    const temiz = ad.trim();
    const key = colorKeyFromName(temiz);
    if (!key) {
      setUyari("Renge bir ad verin (ör. Gül Kurusu).");
      return;
    }
    // Ad iki dilde de aynı yazılıyor — ürün adında olduğu gibi. Renk
    // adları da marka dili; ayrı bir İngilizce kutusu istemek, aynı şeyi
    // iki kez yazdırmaktan başka işe yaramıyordu.
    onAdd({ key, tr: temiz, en: temiz, hex: ton });
    setAd("");
    setUyari(null);
  }

  return (
    <div className="sm:col-span-2">
      {/* ── Seçili renkler ── */}
      <p className="text-caption text-ink-60">
        Seçili renkler {selected.length > 0 && `(${selected.length})`}
      </p>
      {selected.length === 0 ? (
        <p className="mt-2 rounded-card border border-line bg-ground-2 px-4 py-3 text-caption text-ink-40">
          Henüz renk seçilmedi. Aşağıdan hazır bir renge tıklayın ya da kendi renginizi ekleyin.
        </p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {selected.map((c, i) => (
            <li
              key={c.key}
              className="flex items-center gap-2 rounded-card border border-ink bg-ground-2 py-1.5 pl-1.5 pr-2 text-caption text-ink"
            >
              {/* Yuvarlağın kendisi renk kutusu: tona tıklayıp değiştirin */}
              <label className="relative h-6 w-6 shrink-0 cursor-pointer">
                <span
                  className="block h-6 w-6 rounded-full border border-line"
                  style={{ backgroundColor: c.hex }}
                />
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => onAdd({ ...c, hex: e.target.value })}
                  aria-label={`${c.tr} tonunu değiştir`}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
              <span>{c.tr}</span>
              {i === 0 && <span className="text-ink-40">· kapak</span>}
              <button
                type="button"
                onClick={() => onToggle(c)}
                aria-label={`${c.tr} rengini kaldır`}
                className="ml-1 rounded-full px-1.5 text-ink-40 hover:text-ink"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── Kendi rengin ── */}
      <div className="mt-6 rounded-card border border-line bg-ground-2 p-4">
        <p className="text-caption text-ink-60">Kendi renginizi ekleyin</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="relative h-11 w-11 shrink-0 cursor-pointer">
            <span
              className="block h-11 w-11 rounded-card border border-line-strong"
              style={{ backgroundColor: ton }}
            />
            <input
              type="color"
              value={ton}
              onChange={(e) => setTon(e.target.value)}
              aria-label="Renk tonu"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
          <input
            type="text"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            /* Enter formu göndermesin: burada Enter "rengi ekle" demek */
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                ekle();
              }
            }}
            placeholder="Renk adı (ör. Gül Kurusu)"
            className="min-w-48 flex-1 rounded-card border border-line-strong bg-ground px-4 py-2.5 text-body text-ink focus:border-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={ekle}
            className="rounded-card bg-ink px-5 py-2.5 text-caption font-medium text-ground"
          >
            Ekle
          </button>
        </div>
        {uyari && (
          <p role="alert" className="mt-2 text-caption text-ink">
            {uyari}
          </p>
        )}
      </div>

      {/* ── Hazır renkler ── */}
      <p className="mt-6 text-caption text-ink-60">Hazır renkler</p>
      <div className="mt-2 max-h-72 overflow-y-auto rounded-card border border-line p-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {presetColors.map((c) => {
            const secili = seciliAnahtarlar.has(c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onToggle(c)}
                aria-pressed={secili}
                className={`flex items-center gap-2.5 rounded-card border px-3 py-2.5 text-left text-caption text-ink ${
                  secili ? "border-ink bg-ground-2" : "border-line-strong"
                }`}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-line"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="truncate">{c.tr}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
