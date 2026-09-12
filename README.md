# YSMN — Çanta Kataloğu

Kaydırmanın kendisinin keyifli olduğu bir vitrin. Kadın koleksiyonu editoryal ve
sıcak; erkek/evrak koleksiyonu teknik ve koyu. İkisi arasındaki geçiş sekme değil,
sayfanın kendi paletini değiştirmesi.

**Anasayfa katalog değil, vitrindir:** her bölümden birkaç parça gösterir ve iki
net kapı verir (Kadın / Erkek). Katalogun tamamı tek yerde, `/koleksiyon`'da durur —
müşteri aynı ürünlerle iki ayrı yerde karşılaşmasın diye.

Ziyaretçi gezerken beğendiklerini **seçkisine** ekler; seçkiyi tek tıkla
WhatsApp'tan gönderir, bağlantı olarak paylaşır ya da PDF indirir.

## Çalıştırma

```bash
npm install
cp .env.example .env.local   # marka, WhatsApp numarası, alan adı
npm run dev                  # http://localhost:3000
```

```bash
npm run build && npm start   # production
```

## Ürün eklemek / düzenlemek

Tek kaynak: **`src/data/products.ts`**. Listeye yeni bir satır ekleyin:

```ts
{
  slug: "yeni-canta",            // adreste görünür, ASCII olmalı
  code: "YSM-1042",
  tr: "Yeni Çanta", en: "New Bag",
  segment: "kadin",              // kadin | erkek
  form: "omuz",                  // tote | omuz | baguette | clutch | sirt | evrak | postaci
  colors: ["taba", "siyah"],     // src/data/colors.ts
  material: "deri",              // src/data/materials.ts
  dims: [26, 18, 8],             // G, Y, D — santimetre
  strap: "ayarlanabilir",
  features: [F.manyetik, F.kart],
  isNew: true,
}
```

`dims` yalnızca künye için değil: ürün sayfasındaki **ölçek karşılaştırması**
(170 cm insan, A4, telefon) bu değerlerden çiziliyor.

## Fotoğraf eklemek

Gerçek fotoğraf yokken katalog forma göre çizilmiş silüetler gösterir.
Fotoğraflar geldiğinde `public/products/README.md` dosyasındaki kurala göre
ekleyin; kod tarafında değişmesi gereken tek yer `src/components/ProductMedia.tsx`
değil — o zaten hazır, sadece `products.ts` içindeki `images` dizilerini doldurun.

## Yapı

```
src/
  app/[locale]/           tr / en — tüm sayfalar dil önekli
    page.tsx              anasayfa (yedi bölümlük vitrin, ~18 ürün)
    koleksiyon/           katalogun tamamı + filtre (filtre durumu URL'de)
    urun/[slug]/          ürün detayı (tam sayfa)
    @modal/(.)urun/       aynı detay, ızgaradan açılınca pencere olarak
    secki/                seçki + /yazdir A4 baskı görünümü
    atolye/
  components/
    BagSilhouette.tsx     7 form için çizgisel SVG silüet
    ProductMedia.tsx      fotoğraf ↔ silüet sınırı (tek değişim noktası)
    ModeSection.tsx       bölüm ekranın ortasına gelince <body> modunu çevirir
    ScaleCompare.tsx      gerçek ölçekli boyut karşılaştırması
  data/                   products / colors / materials — içerik burada
  i18n/                   tr.json, en.json (anahtarları eşit tutun)
  store/selection.ts      seçki (zustand + localStorage)
```

## Dikkat edilenler

- **Tema** `data-mode` attribute'una bağlı CSS değişkenleriyle çalışır; bir
  bölümün üstüne `data-mode="erkek"` koymak o bölümün tamamını dönüştürür.
- **Hero giriş animasyonu bilerek CSS** (`.hero-line`). JS ile yapılsaydı
  hidrasyon bitene kadar metin görünmez kalır ve LCP ~2.3s'ye çıkardı; CSS ile
  0.3s.
- **CLS = 0**: her görsel sabit en-boy oranlı kutuda.
- **Filtrede ölü uç yok.** Tıklanabilir her seçenek en az bir ürüne çıkar:
  seçenekler faceted mantıkla, *diğer* filtrelere göre süzülmüş listeden
  hesaplanır (`availableOptions`, `src/lib/filters.ts`). Erkek tarafında clutch,
  bordo seçiliyken bordosu olmayan malzeme hiç gösterilmez.
- **Menüde aktif sayfa işaretlidir.** Bölüm bilgisi query string'de olduğu için
  `useSearchParams` gerekiyor; nav bu yüzden `<Suspense>` içinde. Fallback aynı
  menüyü işaretsiz basar, böylece bağlantılar ilk HTML'de yerinde kalır.
- `prefers-reduced-motion` açıkken tüm hareket kapanır, içerik eksiksiz kalır.
- Seçki sayfaları `robots` ile dizine kapalıdır (kişiye özel ve paylaşım
  bağlantılı).
