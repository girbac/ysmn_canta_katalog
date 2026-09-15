/**
 * Fotoğrafı yüklemeden ÖNCE tarayıcıda küçültür.
 *
 * İki sebeple şart:
 *
 *  1. Sunucuya gidebilecek istek gövdesi birkaç megabaytla sınırlı.
 *     Telefon fotoğrafları (8-12 MB) bu sınırı aşıyor ve yükleme, sebebi
 *     anlaşılmayan bir hatayla düşüyordu.
 *  2. Fotoğraflar depoda duruyor ve siteye oradan servis ediliyor. Yüzlerce
 *     ham fotoğraf hem depoyu şişirir hem siteyi yavaşlatır.
 *
 * Çıktı her zaman webp: katalog fotoğrafı için en küçük dosyayı veren
 * biçim. EXIF yönü `from-image` ile korunuyor — yoksa telefonla dikey
 * çekilen çantalar yan yatıyor.
 *
 * Herhangi bir adım tutmazsa dosya olduğu gibi bırakılıyor: küçültememek,
 * yükleyememekten iyidir.
 */
const EN_BUYUK_KENAR = 1600;
const KALITE = 0.82;

export async function fotoKucult(dosya: File): Promise<File> {
  try {
    const gorsel = await createImageBitmap(dosya, { imageOrientation: "from-image" });

    const olcek = Math.min(
      1,
      EN_BUYUK_KENAR / Math.max(gorsel.width, gorsel.height),
    );
    const en = Math.round(gorsel.width * olcek);
    const boy = Math.round(gorsel.height * olcek);

    const tuval = document.createElement("canvas");
    tuval.width = en;
    tuval.height = boy;
    const kalem = tuval.getContext("2d");
    if (!kalem) return dosya;
    kalem.drawImage(gorsel, 0, 0, en, boy);
    gorsel.close();

    const parca = await new Promise<Blob | null>((bitti) =>
      tuval.toBlob(bitti, "image/webp", KALITE),
    );
    if (!parca || parca.size === 0) return dosya;

    // Küçültme büyütmeye dönüştüyse (küçük ya da zaten sıkı bir dosya)
    // aslını koru
    if (parca.size >= dosya.size && olcek === 1) return dosya;

    const ad = dosya.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([parca], ad, { type: "image/webp" });
  } catch {
    return dosya;
  }
}
