# Ürün fotoğrafları

Her ürün için bu klasörün altında **slug adında** bir klasör açın:

```
public/products/
  meridyen-tote/
    taba-1.webp
    taba-2.webp
    siyah-1.webp
  hilal-omuz/
    siyah-1.webp
```

Sonra `src/data/products.ts` içinde ilgili rengin `images` dizisine dosya
adlarını yazın:

```ts
colors: [
  variant("taba", ["taba-1.webp", "taba-2.webp"]),
  variant("siyah", ["siyah-1.webp"]),
  variant("krem"),          // ← boş: silüet placeholder çizilir
]
```

Bir rengin `images` dizisi boş kaldığı sürece katalog o renk için forma göre
çizilmiş silüeti gösterir. Yani fotoğrafları **tek tek, sırayla** ekleyebilirsiniz;
eksik olanlar hata vermez.

## Önerilen dosya özellikleri

| | |
|---|---|
| Oran | **1:1 kare** (katalog her yerde kare kullanıyor) |
| Çözünürlük | 2000 × 2000 px |
| Format | `.webp` veya `.avif` (`.jpg` de çalışır) |
| Dosya boyutu | 300 KB altı |
| Zemin | Düz, açık gri/krem stüdyo zemini |
| Kadraj | Çanta karenin ~%80'ini doldursun, altında hafif gölge |

İlk fotoğraf (`-1`) listede ve kartlarda görünen kapak görselidir; diğerleri
ürün detayında galeri olarak kullanılır.
