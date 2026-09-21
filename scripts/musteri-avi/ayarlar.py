"""Müşteri avı için hedef tanımı ve puanlama kuralları.

Burası tek ayar dosyasıdır: hedef şehir/sorgu ızgarası, rakip elemesi ve
puanlama ağırlıkları buradan değiştirilir. Kod dosyalarına dokunmak gerekmez.
"""

# ── Hedef kitle ───────────────────────────────────────────────────────────
# YSMN toptan çanta verir; aday müşteri = çantayı RAFINDA SATAN perakendeci.
# İmalatçı/toptancı rakiptir, aşağıdaki RAKIP_ISARETLERI ile elenir.

SORGULAR = [
    "çanta mağazası",
    "kadın çanta mağazası",
    "deri çanta mağazası",
    "ayakkabı ve çanta mağazası",
    "kadın giyim butik",
    "moda aksesuar mağazası",
    "deri ürünleri mağazası",
]

# (şehir sorgusu, kademe) — kademe konum puanını belirler.
SEHIRLER = [
    ("İstanbul, Türkiye", 1),
    ("Ankara, Türkiye", 1),
    ("İzmir, Türkiye", 1),
    ("Bursa, Türkiye", 2),
    ("Antalya, Türkiye", 2),
    ("Adana, Türkiye", 2),
    ("Konya, Türkiye", 2),
    ("Gaziantep, Türkiye", 2),
    ("Kocaeli, Türkiye", 2),
    ("Kayseri, Türkiye", 3),
    ("Eskişehir, Türkiye", 3),
    ("Samsun, Türkiye", 3),
    ("Denizli, Türkiye", 3),
    ("Mersin, Türkiye", 3),
    ("Trabzon, Türkiye", 3),
]

# Her sorgu × şehir için Maps'ten çekilecek azami kayıt.
SORGU_BASI_KAYIT = 20

# Rapora girecek azami aday.
AZAMI_ADAY = 100

# ── Eleme ─────────────────────────────────────────────────────────────────
# Adı/kategorisi bunları içeren kayıt rakip ya da alakasız sayılır.
RAKIP_ISARETLERI = [
    "toptan", "imalat", "imalath", "üretim", "uretim", "fabrika", "sanayi",
    "tamir", "tamirci", "aksesuar malzeme", "çanta malzeme", "canta malzeme",
    "kırtasiye", "kirtasiye", "hırdavat", "hirdavat", "kuru temizleme",
    "ayakkabı tamir", "ayakkabi tamir", "çilingir", "cilingir",
]

# Zincir/kurumsal alıcı: merkezden satın alır, ayrı bir satış süreci ister.
ZINCIR_ISARETLERI = [
    "desa", "derimod", "matraş", "matras", "hotiç", "hotic", "inci deri",
    "i̇nci deri", "divarese", "beymen", "boyner", "vakko", "network",
    "lc waikiki", "koton", "defacto", "flo ", "ayakkabı dünyası", "tergan",
]

# ── Puanlama (toplam 100) ─────────────────────────────────────────────────
# 1) Ürün uyumu — 30: rafında ne satıyor?
URUN_UYUMU = [
    (30, ["çanta mağaza", "canta mağaza", "çanta satış", "handbag", "çantacı", "cantaci"]),
    (28, ["deri ürün", "deri mağaza", "leather goods", "saraciye", "saraciyeci"]),
    (24, ["ayakkabı ve çanta", "ayakkabi ve canta", "ayakkabı mağaza", "shoe store"]),
    (20, ["butik", "boutique", "kadın giyim", "kadin giyim", "women's clothing"]),
    (16, ["aksesuar", "accessories", "takı", "taki", "hediyelik"]),
    (12, ["valiz", "bavul", "luggage", "seyahat"]),
    (8,  ["giyim", "moda", "clothing", "fashion"]),
]
URUN_UYUMU_VARSAYILAN = 6

# 2) Talep sinyali — 20: yorum sayısı × puan (mağazanın müşteri trafiği vekili)
def talep_puani(yorum_sayisi: int, yildiz: float) -> int:
    n = yorum_sayisi or 0
    if n >= 500:
        taban = 16
    elif n >= 200:
        taban = 14
    elif n >= 80:
        taban = 12
    elif n >= 30:
        taban = 9
    elif n >= 10:
        taban = 6
    elif n >= 1:
        taban = 3
    else:
        taban = 0
    bonus = 4 if (yildiz or 0) >= 4.5 else 2 if (yildiz or 0) >= 4.0 else 0
    return min(20, taban + bonus)

# 3) Dijital olgunluk — 20: web sitesi, e-ticaret, Instagram
PUAN_WEB = 8
PUAN_ETICARET = 6          # sepet/ödeme izi olan site
PUAN_INSTAGRAM = 6

# 4) Erişilebilirlik — 20: iletişim kanalı ne kadar net?
PUAN_EPOSTA_KURUMSAL = 13  # kendi alan adında e-posta (info@marka.com)
PUAN_EPOSTA_GENEL = 8      # gmail/hotmail vb.
PUAN_TELEFON = 5
PUAN_SOSYAL_DM = 2

# 5) Konum avantajı — 10: sevkiyat ve saha ziyareti kolaylığı
KONUM_PUANI = {1: 10, 2: 8, 3: 6}

# Not düzeyleri
def kademe(puan: int) -> str:
    if puan >= 78:
        return "A"
    if puan >= 62:
        return "B"
    return "C"
