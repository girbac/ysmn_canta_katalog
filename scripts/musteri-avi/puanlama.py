"""Ham Maps + iletişim verisini tek bir aday kaydına ve puana çevirir.

Puan 100 üzerindendir ve beş bileşenden oluşur (ayarlar.py'de ağırlıklar):
ürün uyumu 30 · talep sinyali 20 · dijital olgunluk 20 · erişilebilirlik 20 ·
konum 10. Her aday için bileşenler ayrı ayrı saklanır; rapor bunları gösterir,
böylece puanın nereden geldiği tartışılabilir olur.
"""

from __future__ import annotations

import re
from urllib.parse import urlparse

import ayarlar

COP_EPOSTA = re.compile(
    r"(noreply|no-reply|example\.|sentry|wixpress|godaddy|domain|hosting|"
    r"webmaster@|kvkk|@sentry|\.png|\.jpg|@2x)", re.I
)
GENEL_SAGLAYICI = ("gmail.", "hotmail.", "outlook.", "yahoo.", "yandex.", "icloud.", "mynet.")
TERCIHLI_KUTU = ("info", "iletisim", "satis", "satınalma", "satinalma", "siparis",
                 "bilgi", "destek", "merhaba", "hello", "contact", "sales")


def alan_adi(site: str | None) -> str:
    if not site:
        return ""
    if "://" not in site:
        site = "https://" + site
    ad = (urlparse(site).netloc or "").lower()
    return ad[4:] if ad.startswith("www.") else ad


def _metin(kayit: dict) -> str:
    parcalar = [
        kayit.get("title") or "",
        kayit.get("categoryName") or "",
        " ".join(kayit.get("categories") or []),
    ]
    return " ".join(parcalar).lower()


def rakip_mi(kayit: dict) -> bool:
    metin = _metin(kayit)
    return any(isaret in metin for isaret in ayarlar.RAKIP_ISARETLERI)


def zincir_mi(kayit: dict) -> bool:
    metin = _metin(kayit)
    return any(isaret in metin for isaret in ayarlar.ZINCIR_ISARETLERI)


def urun_uyumu(kayit: dict) -> int:
    metin = _metin(kayit)
    for puan, anahtarlar in ayarlar.URUN_UYUMU:
        if any(anahtar in metin for anahtar in anahtarlar):
            return puan
    return ayarlar.URUN_UYUMU_VARSAYILAN


def en_iyi_eposta(epostalar: list[str], site: str | None) -> tuple[str, str]:
    """(eposta, tür) döndürür; tür: kurumsal | genel | ''."""
    ad = alan_adi(site)
    temiz = []
    for e in epostalar or []:
        e = (e or "").strip().lower().strip(".,;:")
        if "@" not in e or COP_EPOSTA.search(e):
            continue
        temiz.append(e)
    if not temiz:
        return "", ""

    def sira(e: str) -> tuple:
        kutu, _, saglayici = e.partition("@")
        kurumsal = bool(ad) and ad in saglayici
        tercihli = any(kutu.startswith(k) for k in TERCIHLI_KUTU)
        return (0 if kurumsal else 1, 0 if tercihli else 1, len(e))

    en_iyi = sorted(dict.fromkeys(temiz), key=sira)[0]
    saglayici = en_iyi.split("@")[1]
    if saglayici.startswith(GENEL_SAGLAYICI) or any(s in saglayici for s in GENEL_SAGLAYICI):
        return en_iyi, "genel"
    return en_iyi, "kurumsal"


def dijital_olgunluk(kayit: dict, iletisim: dict) -> tuple[int, list[str]]:
    puan, notlar = 0, []
    if kayit.get("website"):
        puan += ayarlar.PUAN_WEB
        notlar.append("web sitesi")
    if iletisim.get("eticaret"):
        puan += ayarlar.PUAN_ETICARET
        notlar.append("e-ticaret")
    if iletisim.get("instagram"):
        puan += ayarlar.PUAN_INSTAGRAM
        notlar.append("Instagram")
    return min(20, puan), notlar


def erisilebilirlik(kayit: dict, eposta_turu: str, iletisim: dict) -> int:
    puan = 0
    if eposta_turu == "kurumsal":
        puan += ayarlar.PUAN_EPOSTA_KURUMSAL
    elif eposta_turu == "genel":
        puan += ayarlar.PUAN_EPOSTA_GENEL
    if kayit.get("phone") or iletisim.get("telefon"):
        puan += ayarlar.PUAN_TELEFON
    if iletisim.get("instagram"):
        puan += ayarlar.PUAN_SOSYAL_DM
    return min(20, puan)


def aday_kur(kayit: dict, iletisim: dict, sehir_kademesi: int) -> dict:
    """Bir Maps kaydı + web sitesinden toplanan iletişim verisi → aday kaydı."""
    eposta, eposta_turu = en_iyi_eposta(iletisim.get("epostalar", []), kayit.get("website"))
    b_urun = urun_uyumu(kayit)
    b_talep = ayarlar.talep_puani(kayit.get("reviewsCount") or 0, kayit.get("totalScore") or 0)
    b_dijital, dijital_notlar = dijital_olgunluk(kayit, iletisim)
    b_erisim = erisilebilirlik(kayit, eposta_turu, iletisim)
    b_konum = ayarlar.KONUM_PUANI.get(sehir_kademesi, 6)
    toplam = b_urun + b_talep + b_dijital + b_erisim + b_konum

    return {
        "isim": (kayit.get("title") or "").strip(),
        "kategori": kayit.get("categoryName") or "",
        "sehir": kayit.get("city") or "",
        "ilce": kayit.get("neighborhood") or "",
        "adres": kayit.get("address") or "",
        "telefon": kayit.get("phone") or iletisim.get("telefon", ""),
        "site": kayit.get("website") or "",
        "alan_adi": alan_adi(kayit.get("website")),
        "eposta": eposta,
        "eposta_turu": eposta_turu,
        "diger_epostalar": [e for e in iletisim.get("epostalar", []) if e != eposta][:4],
        "instagram": iletisim.get("instagram", ""),
        "yildiz": kayit.get("totalScore") or 0,
        "yorum": kayit.get("reviewsCount") or 0,
        "harita": kayit.get("url") or "",
        "yer_kimligi": kayit.get("placeId") or "",
        "zincir": zincir_mi(kayit),
        "bilesenler": {
            "urun_uyumu": b_urun,
            "talep": b_talep,
            "dijital": b_dijital,
            "erisim": b_erisim,
            "konum": b_konum,
        },
        "dijital_notlar": dijital_notlar,
        "puan": toplam,
        "kademe": ayarlar.kademe(toplam),
    }
