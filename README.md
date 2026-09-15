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

## Yönetim paneli (`/admin`)

Ürün ekleme/düzenleme/silme, sıralama ve fotoğraf yükleme panelden yapılır.
Kod bilgisi gerekmez.

### Açmak için

Panel **şifre tanımlanmadan açılmaz** (varsayılan: kapalı). Sunucu ortamına:

```
ADMIN_PASSWORD=en-az-8-karakter
ADMIN_SECRET=rastgele-uzun-bir-dize        # zorunlu değil, tercih edilir
```

Yereldeyken aynı değerleri `.env.local` dosyasına yazın.

### Katalog nerede duruyor?

**Bu projenin deposu kendi GitHub deposudur.** Katalog ve bütün fotoğraflar
oraya yazılır:

| Depo | Ne zaman | Nereye yazar |
|---|---|---|
| **GitHub deposu** | `GITHUB_TOKEN` tanımlıysa | `katalog/urunler.json` + `katalog/fotograflar/<adres>/…` |
| **Dosya sistemi** | Token yoksa (yerel geliştirme) | `src/data/products.json` + `public/products/<adres>/` |

Canlıda GitHub şart: sunucunun dosya sistemi salt okunurdur.

#### Kurulum (tek değişken)

Vercel → projeniz → **Settings → Environment Variables**:

```
GITHUB_TOKEN=github_pat_...
```

Anahtarı GitHub'da **Settings → Developer settings → Personal access tokens →
Fine-grained tokens** altından üretin. Yalnızca bu depoyu seçin ve tek bir izin
verin: **Repository permissions → Contents → Read and write**.

Depo adı ve dal Vercel tarafından zaten sağlanıyor (`VERCEL_GIT_*`), elle
girmeniz gerekmez. Gerekirse `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` ile
üzerine yazabilirsiniz.

#### Neden GitHub?

Önceki depo Vercel Blob'du ve bu seçim bir veri kaybına yol açtı: Hobby planının
kotası doldu, depo erişimi **bir aylığına** kapandı, okumalar başarısız oldu ve
zincirin sonunda katalogun üzerine demo veri yazıldı. Ders şu: kotası olan,
kapanabilen bir depo katalogun asıl yeri olamaz.

GitHub deposunun karşıladıkları:

- Ayrı bir servis, ayrı bir kota, ayrı bir fatura yok — depo zaten var.
- **Her değişiklik bir commit.** Geçmiş kendiliğinden tutuluyor; "yedek alma"
  diye ayrı bir iş yok, panelin Kurtarma ekranı bu geçmişi listeliyor ve
  herhangi bir hâle geri dönülebiliyor.
- Yazmalar dosyanın `sha`'sıyla yapılıyor: arada başka bir yerden yazıldıysa
  GitHub reddediyor. İki kaydetmenin birbirini ezmesi mümkün değil.
- Fotoğraflar `/foto/<adres>/<dosya>` yolundan servis ediliyor, yani yüklendiği
  anda görünüyor — yeni bir yayın beklenmiyor. Veri commit'leri `[skip ci]`
  taşıdığı için siteyi yeniden derlemiyor.

Fotoğraflar yüklenmeden önce **tarayıcıda** küçültülüp webp'ye çevriliyor
(uzun kenar 1600 px). Telefondan çekildiği gibi seçebilirsiniz; boyutla
uğraşmak gerekmiyor.

Depoda henüz veri yokken katalog paketle gelen tohumdan
(`src/data/products.json`) okunur — ilk dağıtımda site hiç boş görünmez. Okuma
**hatası** ise asla tohuma düşmez: hata yukarı çıkar, panel durumu söyler ve
hiçbir şey yazılmaz. Veri kaybının sebebi tam olarak bu ayrımın yapılmamasıydı.

### Nasıl çalışır

- Doğrulama tek şemadan gelir: `src/lib/catalog/schema.ts` (zod). Aynı şema
  hem depodan okunanı hem panelden gireni doğrular, hem de TypeScript
  tiplerini üretir — panelden katalogun kabul etmeyeceği bir veri geçemez.
- Kaydetmeden sonra ilgili genel sayfalar `revalidatePath` ile tazelenir;
  sayfalar statik hızını korur.
- Fotoğraf dosya adı **sunucuda** üretilir (`renk-zamandamgası.uzantı`);
  kullanıcıdan gelen ad hiç kullanılmaz. Tür ve boyut sınırı: webp/avif/jpg/png,
  en fazla 6 MB.
- Oturum, HMAC-SHA256 ile imzalanmış httpOnly bir kurabiyedir (12 saat).
  Şifre kurabiyede tutulmaz. Hem `proxy.ts` hem her sayfa/aksiyon oturumu
  ayrıca doğrular — tek katmana güvenilmez.
- `/admin` `robots.txt` ile dizine kapalıdır.

## Ürün eklemek / düzenlemek (kodla)

Panel yerine dosyayı elle düzenlemek isterseniz tek kaynak
**`src/data/products.json`**. Alan yapısı:

```json
{
  "slug": "yeni-canta",
  "code": "YSM-1042",
  "name": { "tr": "Yeni Çanta", "en": "New Bag" },
  "segment": "kadin",
  "form": "omuz",
  "material": "deri",
  "dimensions": { "w": 26, "h": 18, "d": 8 },
  "colors": [
    { "key": "taba", "name": { "tr": "Taba", "en": "Tan" },
      "hex": "#A9784E", "images": [] }
  ],
  "features": [{ "tr": "Manyetik kapak", "en": "Magnetic flap" }],
  "strap": "ayarlanabilir",
  "isNew": true
}
```

Geçerli değerler: `segment` → kadin | erkek · `form` → tote | omuz | baguette |
clutch | sirt | evrak | postaci · `material` → `src/data/materials.ts`.
Listedeki **sıra** katalog sırasıdır.

Renkler kapalı bir liste değil: `src/data/colors.ts` yalnızca panelde tek
tıkla seçilen **hazır renkleri** tutuyor, panelden istenen ada ve tona sahip
yeni bir renk eklenebiliyor. Her ürün rengini kendi içinde saklıyor
(`key` + `name` + `hex`), yani palete sonradan dokunmak kayıtlı ürünleri
etkilemiyor. Anahtar filtre adresinde geçtiği için küçük harf, rakam ve
tireyle sınırlı; panel Türkçe addan kendisi üretiyor ("Gül Kurusu" →
`gul-kurusu`).

`dimensions` yalnızca künye için değil: ürün sayfasındaki **ölçek
karşılaştırması** (170 cm insan, A4, telefon) bu değerlerden çiziliyor.

## Fotoğraf eklemek

En kolay yol panel: **/admin → ürün → Fotoğraflar**, her renk için ayrı yükleme.

Elle eklemek isterseniz `public/products/README.md` dosyasındaki kurala göre
dosyaları koyup ilgili rengin `images` dizisine yazın. Üç biçim de kabul edilir
(`src/lib/catalog/image-source.ts`): dosya adı, köke göre yol ya da tam URL.
Fotoğraf olmayan renkler forma göre çizilmiş silüetle gösterilir; yani
fotoğrafları tek tek ekleyebilirsiniz, eksik olanlar hata vermez.

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
  app/admin/              yönetim paneli (liste, form, fotoğraf, giriş)
  lib/catalog/            şema (zod), depo adaptörleri, okuma/yazma
  lib/admin-auth.ts       imzalı oturum kurabiyesi
  data/                   products.json / colors / materials — içerik burada
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
