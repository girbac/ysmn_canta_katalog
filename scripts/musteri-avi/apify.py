"""Apify REST istemcisi — yalnızca standart kütüphane.

Aktörü asenkron başlatır, bitene kadar yoklar, veri kümesini indirir ve
çalışmanın GERÇEK maliyetini (usageTotalUsd) döndürür. Maliyeti tahmin
etmiyoruz; Apify'ın kendi raporladığı tutarı okuyoruz.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

TABAN = "https://api.apify.com/v2"


class ApifyHatasi(RuntimeError):
    pass


def _jeton() -> str | None:
    """Jeton ortamdan okunur; yoksa None döner.

    None dönmesi hata değildir: ortam "API credentials" ile kurulduysa jetonu
    istek VM'den çıktıktan sonra proxy ekler, jeton hiç buraya gelmez.
    """
    return os.environ.get("APIFY_TOKEN") or os.environ.get("APIFY_API_TOKEN")


def _istek(yol: str, yontem: str = "GET", govde: dict | None = None, sorgu: dict | None = None):
    sorgu = dict(sorgu or {})
    url = f"{TABAN}{yol}?{urllib.parse.urlencode(sorgu)}" if sorgu else f"{TABAN}{yol}"
    veri = json.dumps(govde).encode() if govde is not None else None
    basliklar = {}
    # Jeton başlıkta gider; sorgu dizesinde giderse kayıtlara/loglara sızar.
    jeton = _jeton()
    if jeton:
        basliklar["Authorization"] = f"Bearer {jeton}"
    if veri:
        basliklar["Content-Type"] = "application/json"
    istek = urllib.request.Request(url, data=veri, method=yontem, headers=basliklar)
    try:
        with urllib.request.urlopen(istek, timeout=180) as yanit:
            ham = yanit.read()
    except urllib.error.HTTPError as hata:
        detay = hata.read().decode("utf-8", "replace")[:400]
        if hata.code in (401, 403):
            detay += ("\n  → Jeton yok ya da geçersiz. APIFY_TOKEN'ı ortama ekleyin "
                      "ya da ortamın API credentials kaydını api.apify.com için tanımlayın.")
        raise ApifyHatasi(f"Apify {hata.code}: {detay}") from hata
    except urllib.error.URLError as hata:
        raise ApifyHatasi(
            f"Apify'a ulaşılamadı ({hata.reason}). Ağ/proxy api.apify.com'a izin veriyor mu?"
        ) from hata
    if not ham:
        return None
    coz = json.loads(ham)
    return coz.get("data", coz)


def kullanici() -> dict:
    """Jetonu doğrular; hesap adını ve plan bilgisini döndürür."""
    return _istek("/users/me")


def calistir(aktor: str, girdi: dict, etiket: str = "", bekleme: int = 10) -> tuple[list[dict], dict]:
    """Aktörü çalıştırır, biter bitmez (kayıtlar, çalışma_bilgisi) döndürür."""
    aktor_yolu = aktor.replace("/", "~")
    calisma = _istek(f"/acts/{aktor_yolu}/runs", "POST", girdi)
    kimlik = calisma["id"]
    print(f"  ▸ {etiket or aktor}: çalışma {kimlik} başladı", flush=True)

    while True:
        time.sleep(bekleme)
        calisma = _istek(f"/actor-runs/{kimlik}")
        durum = calisma["status"]
        if durum in {"SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"}:
            break
        print(f"    … {durum}", flush=True)

    if durum != "SUCCEEDED":
        print(f"  ! {etiket}: {durum} — bu adım atlandı", file=sys.stderr)
        return [], calisma

    kayitlar = kayitlari_getir(calisma["defaultDatasetId"])
    print(
        f"  ✓ {etiket or aktor}: {len(kayitlar)} kayıt, "
        f"{calisma.get('usageTotalUsd', 0):.4f} USD",
        flush=True,
    )
    return kayitlar, calisma


def kayitlari_getir(veri_kumesi: str) -> list[dict]:
    hepsi: list[dict] = []
    while True:
        parca = _istek(
            f"/datasets/{veri_kumesi}/items",
            sorgu={"offset": len(hepsi), "limit": 1000, "clean": "true"},
        ) or []
        hepsi.extend(parca)
        if len(parca) < 1000:
            return hepsi
