# Müşteri avı — toptan çanta için aday perakendeci listesi

YSMN toptan çanta veriyor; bu araç **çantayı rafında satan perakende
noktalarını** bulur, iletişim bilgisini toplar, puanlar ve iki çıktı üretir:

- `cikti/musteri-adaylari.html` — tarayıcıda açılan, filtrelenebilir liste
- `cikti/musteri-adaylari.xlsx` — Adaylar / Özet / Yöntem sekmeleri

Veri kaynağı Apify'dır: önce Google Haritalar taranır, sonra kalan mağazaların
**kendi web sitelerinden** e-posta ve Instagram toplanır.

## Çalıştırma

```bash
pip install -r requirements.txt
export APIFY_TOKEN=apify_api_...          # jeton koda yazılmaz, ortamdan okunur
python3 topla.py                          # tam tarama  → veri/adaylar.json
python3 rapor.py                          # rapor       → cikti/
```

Önce küçük bir deneme (tek şehir, tek sorgu, ~5 kayıt — birkaç sent):

```bash
python3 topla.py --hizli && python3 rapor.py
```

Bütçeyi kısmak için:

```bash
python3 topla.py --kademe 2 --kayit 15 --iletisim-siniri 120
```

| Bayrak | Ne yapar | Varsayılan |
|---|---|---|
| `--kademe` | Kaçıncı kademeye kadar şehir taransın (1 = yalnız İstanbul/Ankara/İzmir) | 3 |
| `--kayit` | Her şehir × sorgu için azami Maps kaydı | 20 |
| `--iletisim-siniri` | Kaç mağazanın sitesi e-posta için taransın | 160 |
| `--hizli` | Tek şehir + tek sorgu deneme koşusu | kapalı |

Hedef şehirler, arama sorguları, eleme kelimeleri ve puan ağırlıkları
`ayarlar.py` içindedir; koda dokunmadan değiştirilebilir.

## Dosyalar

| Dosya | İşi |
|---|---|
| `ayarlar.py` | Şehir × sorgu ızgarası, rakip elemesi, puan ağırlıkları |
| `apify.py` | Apify REST istemcisi (yalnız standart kütüphane), gerçek maliyeti okur |
| `puanlama.py` | Ham kayıt → aday kaydı; e-posta seçimi ve 5 bileşenli puan |
| `topla.py` | İki aşamalı toplama, eleme, tekilleştirme → `veri/adaylar.json` |
| `rapor.py` | HTML + Excel üretimi |

## Puanlama (100 üzerinden)

| Bileşen | Azami | Ne ölçüyor |
|---|---|---|
| Ürün uyumu | 30 | Kategori çantaya ne kadar yakın (çanta/saraciye tam, giyim butiği kısmi) |
| Talep sinyali | 20 | Haritalar yorum sayısı × yıldız — mağaza trafiği vekili |
| Dijital olgunluk | 20 | Web sitesi, e-ticaret izi, Instagram |
| Erişilebilirlik | 20 | Kurumsal e-posta > genel e-posta > telefon > DM |
| Konum | 10 | Sevkiyat ve saha ziyareti kolaylığı (şehir kademesi) |

Kademeler: **A** 78+ · **B** 62–77 · **C** 62 altı.

Elenenler: toptancı, imalatçı, tamirci, malzemeci (bunlar müşteri değil rakip
ya da tedarikçi); kalıcı kapalı yerler; aynı firmanın ikinci şubesi (alan adı
ve telefon üzerinden tekilleştirme).

## Maliyet

Apify'da iki kalem var: **aktör ücreti** (sonuç başına) ve bunu düşen **plan
kredisi**. Aşağıdakiler liste fiyatlarıdır; `topla.py` her koşudan sonra
Apify'ın raporladığı **gerçek** tutarı yazar ve `veri/adaylar.json` içine
`maliyet_usd` olarak kaydeder.

| Kalem | Liste fiyatı |
|---|---|
| Google Maps Scraper (`compass/crawler-google-places`) | ~4 USD / 1.000 kayıt |
| İletişim tarayıcı (`vdrmota/contact-info-scraper`) | ~0,002 USD / sayfa (~2 USD / 1.000 sayfa) |
| Apify Free planı | 0 USD/ay, 5 USD aylık kredi |
| Apify Starter planı | ~19–29 USD/ay (kredi olarak harcanır) |

Varsayılan ızgaranın tahmini:

| Senaryo | Maps kaydı | İletişim sayfası | Tahmini toplam |
|---|---|---|---|
| `--hizli` deneme | ~5 | ~20 | **< 0,10 USD** |
| Dar tarama (`--kademe 2 --kayit 15`) | ~600 | ~400 | **~3 USD** → Free planın 5 USD kredisine sığar |
| Varsayılan tam tarama (15 şehir × 7 sorgu × 20) | ~1.400–2.100 | ~500–650 | **~7–10 USD** → Starter planı yeter |

100 aday çıkarmanın maliyeti tek seferlik ~3–10 USD bandındadır; liste
tazelemesi (3 ayda bir) aynı tutardır.

## Not

Jeton hiçbir dosyaya yazılmaz, yalnızca `APIFY_TOKEN` ortam değişkeninden
okunur. Depoya jeton commit etmeyin.
