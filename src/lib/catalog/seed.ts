import { catalogSchema, type StoredProduct } from "./schema";
import raw from "@/data/products.json";

/**
 * Paketle gelen tohum katalog.
 *
 * Depoda henüz veri yokken (ilk dağıtım, boş Blob) katalog buradan
 * okunuyor ki site hiçbir zaman boş görünmesin. İlk admin kaydından
 * sonra depo devralıyor.
 */
export const seedProducts: StoredProduct[] = catalogSchema.parse(raw);
