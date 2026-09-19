# Ürün fotoğrafları

**Bu klasör yalnızca yerel geliştirme içindir.** Canlıda katalog ve fotoğraflar
GitHub deposunda durur (`katalog/urunler.json`, `katalog/fotograflar/<adres>/…`)
ve panelden yüklenir: `/admin → ürün → Fotoğraflar`. Panel, seçtiğiniz
fotoğrafı tarayıcıda küçültüp webp'ye çevirir — telefondan çekildiği gibi
seçmeniz yeterli.

Elle eklemek isterseniz her ürün için bu klasörün altında **slug adında** bir
klasör açın:

```
public/products/
  meridyen-tote/
    taba-1.webp
    taba-2.webp
    siyah-1.webp
  hilal-omuz/
    siyah-1.webp
```

Sonra `src/data/products.json` içinde ilgili rengin `images` dizisine dosya
adlarını yazın:

```json
"colors": [
  { "key": "taba",  "images": ["taba-1.webp", "taba-2.webp"] },
  { "key": "siyah", "images": ["siyah-1.webp"] },
  { "key": "krem",  "images": [] }
]
```

Bir rengin `images` dizisi boş kaldığı sürece katalog o renk için forma göre
çizilmiş silüeti gösterir. Yani fotoğrafları **tek tek, sırayla**
ekleyebilirsiniz; eksik olanlar hata vermez.

## Önerilen dosya özellikleri

| | |
|---|---|
| Oran | **2:3 dikey** (kart çerçevesi de 2:3; kırpma olmaz) |
| Çözünürlük | Uzun kenar 1600 px yeter — panel zaten buna indiriyor |
| Format | `.webp` (`.avif`, `.jpg`, `.png` de çalışır) |
| Dosya boyutu | 300 KB altı |
| Zemin | Düz beyaz ya da çok açık gri stüdyo zemini |
| Kadraj | Çanta çerçevenin ~%80'ini doldursun, altında hafif gölge |

## Kapak görseli

Bir rengin **sıradaki ilk** fotoğrafı kapaktır: koleksiyon kartlarında,
anasayfada ve sepette görünen odur. Diğerleri ürün sayfasındaki galeride,
oklarla gezilir. Sırayı panelden fotoğrafları sürükleyerek değiştirebilir,
yani kapağı istediğiniz kareyle değiştirebilirsiniz.
