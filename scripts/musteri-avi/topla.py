#!/usr/bin/env python3
"""Aday müşteri toplama — Apify ile iki aşamalı.

  1) Google Maps Scraper (compass/crawler-google-places):
     şehir × sorgu ızgarasından perakende mağazaları çıkarır.
  2) Contact Details Scraper (vdrmota/contact-info-scraper):
     eleme sonrası kalan mağazaların sitelerinden e-posta/Instagram toplar.

Sonuç: veri/adaylar.json (puanlanmış, sıralı, tekilleştirilmiş) + gerçek maliyet.

Kullanım:
  APIFY_TOKEN=apify_api_... python3 topla.py            # tam tarama
  APIFY_TOKEN=... python3 topla.py --hizli              # tek şehir deneme
  APIFY_TOKEN=... python3 topla.py --kademe 2           # yalnız 1.-2. kademe şehirler
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys
from datetime import datetime, timezone

import apify
import ayarlar
import puanlama

KOK = pathlib.Path(__file__).resolve().parent
CIKTI = KOK / "veri" / "adaylar.json"

MAPS_AKTOR = "compass/crawler-google-places"
ILETISIM_AKTOR = "vdrmota/contact-info-scraper"

ETICARET_IZI = re.compile(
    r"/(sepet|cart|checkout|odeme|siparis|urun|product|collections|kategori|magaza)(/|$|\?)", re.I
)
# İletişim bilgisi bu sayfalarda durur; tarayıcıyı oraya yönlendiriyoruz.
ILETISIM_YOLLARI = ["", "/iletisim", "/iletisim/", "/hakkimizda", "/contact"]


def maps_tara(kademe_siniri: int, kayit_siniri: int, sorgular: list[str]) -> tuple[list[dict], float, list[str]]:
    toplananlar, maliyet, calismalar = [], 0.0, []
    hedefler = [(s, k) for s, k in ayarlar.SEHIRLER if k <= kademe_siniri]
    print(f"\n1/3 · Google Maps taraması — {len(hedefler)} şehir × {len(sorgular)} sorgu")

    for sehir, kademe in hedefler:
        girdi = {
            "searchStringsArray": sorgular,
            "locationQuery": sehir,
            "maxCrawledPlacesPerSearch": kayit_siniri,
            "language": "tr",
            "countryCode": "tr",
            "skipClosedPlaces": True,
            "scrapePlaceDetailPage": False,
        }
        kayitlar, calisma = apify.calistir(MAPS_AKTOR, girdi, etiket=sehir)
        maliyet += float(calisma.get("usageTotalUsd") or 0)
        if calisma.get("id"):
            calismalar.append(calisma["id"])
        for kayit in kayitlar:
            kayit["_kademe"] = kademe
            kayit["_sehir_sorgusu"] = sehir
        toplananlar.extend(kayitlar)

    return toplananlar, maliyet, calismalar


def ele_ve_tekille(kayitlar: list[dict]) -> list[dict]:
    """Kapalı, rakip ve yinelenen kayıtları düşürür."""
    gorulen_yer, gorulen_alan, gorulen_tel = set(), set(), set()
    kalanlar = []
    for kayit in kayitlar:
        if kayit.get("permanentlyClosed") or kayit.get("temporarilyClosed"):
            continue
        if puanlama.rakip_mi(kayit):
            continue
        if not (kayit.get("website") or kayit.get("phone")):
            continue

        yer = kayit.get("placeId") or ""
        alan = puanlama.alan_adi(kayit.get("website"))
        tel = re.sub(r"\D", "", kayit.get("phone") or "")[-10:]
        if yer and yer in gorulen_yer:
            continue
        if alan and alan in gorulen_alan:
            continue
        if tel and tel in gorulen_tel:
            continue
        gorulen_yer.add(yer)
        if alan:
            gorulen_alan.add(alan)
        if tel:
            gorulen_tel.add(tel)
        kalanlar.append(kayit)
    return kalanlar


def on_sirala(kayitlar: list[dict]) -> list[dict]:
    """E-posta aramadan önce kaba puanla sırala; bütçe en iyi adaylara gitsin."""
    def kaba(kayit):
        return (
            puanlama.urun_uyumu(kayit)
            + ayarlar.talep_puani(kayit.get("reviewsCount") or 0, kayit.get("totalScore") or 0)
            + (8 if kayit.get("website") else 0)
            + ayarlar.KONUM_PUANI.get(kayit.get("_kademe", 3), 6)
        )
    return sorted(kayitlar, key=kaba, reverse=True)


def iletisim_topla(kayitlar: list[dict], sinir: int) -> tuple[dict, float, str | None]:
    """Sitelerden e-posta/Instagram toplar → {alan_adi: {...}}"""
    baslangic = []
    for kayit in kayitlar[:sinir]:
        site = kayit.get("website")
        if not site:
            continue
        temel = site.rstrip("/")
        for yol in ILETISIM_YOLLARI:
            baslangic.append({"url": temel + yol})

    if not baslangic:
        return {}, 0.0, None

    print(f"\n2/3 · İletişim taraması — {len(baslangic)} sayfa, "
          f"{len({puanlama.alan_adi(k.get('website')) for k in kayitlar[:sinir] if k.get('website')})} site")

    girdi = {
        "startUrls": baslangic,
        "maxDepth": 1,
        "maxRequestsPerStartUrl": 3,
        "sameDomain": True,
        "considerChildFrames": True,
    }
    kayit_listesi, calisma = apify.calistir(ILETISIM_AKTOR, girdi, etiket="iletişim")

    toplu: dict[str, dict] = {}
    for satir in kayit_listesi:
        alan = puanlama.alan_adi(satir.get("domain") or satir.get("url"))
        if not alan:
            continue
        kutu = toplu.setdefault(alan, {"epostalar": [], "telefon": "", "instagram": "", "eticaret": False})
        kutu["epostalar"].extend(satir.get("emails") or [])
        for tel in satir.get("phones") or []:
            kutu["telefon"] = kutu["telefon"] or tel
        for hesap in satir.get("instagrams") or []:
            kutu["instagram"] = kutu["instagram"] or hesap
        if ETICARET_IZI.search(satir.get("url") or ""):
            kutu["eticaret"] = True
    for kutu in toplu.values():
        kutu["epostalar"] = list(dict.fromkeys(kutu["epostalar"]))

    return toplu, float(calisma.get("usageTotalUsd") or 0), calisma.get("id")


def main() -> int:
    ayristirici = argparse.ArgumentParser(description="Apify ile aday müşteri toplar")
    ayristirici.add_argument("--hizli", action="store_true", help="tek şehir, tek sorgu — deneme")
    ayristirici.add_argument("--kademe", type=int, default=3, help="en fazla kaçıncı kademe şehirler (1-3)")
    ayristirici.add_argument("--kayit", type=int, default=ayarlar.SORGU_BASI_KAYIT)
    ayristirici.add_argument("--iletisim-siniri", type=int, default=160,
                             help="kaç mağazanın sitesi e-posta için taransın")
    secenek = ayristirici.parse_args()

    sorgular = ayarlar.SORGULAR[:1] if secenek.hizli else ayarlar.SORGULAR
    kademe = 1 if secenek.hizli else secenek.kademe
    kayit_siniri = 5 if secenek.hizli else secenek.kayit

    try:
        hesap = apify.kullanici()
        print(f"Apify hesabı: {hesap.get('username')} · plan: {hesap.get('plan', {}).get('id', '—')}")
    except apify.ApifyHatasi as hata:
        print(f"HATA: {hata}", file=sys.stderr)
        return 1

    ham, maps_maliyet, maps_calismalar = maps_tara(kademe, kayit_siniri, sorgular)
    print(f"\n  Maps ham kayıt: {len(ham)}")
    temiz = ele_ve_tekille(ham)
    print(f"  Eleme+tekilleştirme sonrası: {len(temiz)}")
    sirali = on_sirala(temiz)

    iletisim, iletisim_maliyet, iletisim_calisma = iletisim_topla(
        sirali, 20 if secenek.hizli else secenek.iletisim_siniri
    )

    print("\n3/3 · Puanlama")
    adaylar = []
    for kayit in sirali:
        alan = puanlama.alan_adi(kayit.get("website"))
        adaylar.append(puanlama.aday_kur(kayit, iletisim.get(alan, {}), kayit.get("_kademe", 3)))
    adaylar.sort(key=lambda a: (-a["puan"], -a["yorum"]))
    adaylar = adaylar[: ayarlar.AZAMI_ADAY]
    for sira, aday in enumerate(adaylar, 1):
        aday["sira"] = sira

    paket = {
        "olusturma": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "maliyet_usd": round(maps_maliyet + iletisim_maliyet, 4),
        "maliyet_dokum": {
            "google_maps": round(maps_maliyet, 4),
            "iletisim": round(iletisim_maliyet, 4),
        },
        "calismalar": {"maps": maps_calismalar, "iletisim": iletisim_calisma},
        "kapsam": {
            "sorgular": sorgular,
            "sehirler": [s for s, k in ayarlar.SEHIRLER if k <= kademe],
            "ham_kayit": len(ham),
            "eleme_sonrasi": len(temiz),
        },
        "adaylar": adaylar,
    }
    CIKTI.parent.mkdir(parents=True, exist_ok=True)
    CIKTI.write_text(json.dumps(paket, ensure_ascii=False, indent=2), encoding="utf-8")

    epostali = sum(1 for a in adaylar if a["eposta"])
    print(f"\n✓ {len(adaylar)} aday → {CIKTI}")
    print(f"  E-postası bulunan: {epostali} · A kademesi: {sum(1 for a in adaylar if a['kademe'] == 'A')}")
    print(f"  Apify maliyeti: {paket['maliyet_usd']:.2f} USD")
    print("\nRapor için: python3 rapor.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
