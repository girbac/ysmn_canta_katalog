import "server-only";
import type { CatalogStore } from "./store-types";
import { blobStore } from "./store-blob";
import { fsStore } from "./store-fs";

/**
 * Hangi depo kullanılacak?
 *
 * BLOB_READ_WRITE_TOKEN varsa Vercel Blob, yoksa dosya sistemi.
 * Bu sayede panelin tamamı yayına çıkmadan önce yerelde uçtan uca
 * çalıştırılıp test edilebiliyor; canlıya geçişte değişen tek şey
 * bu ortam değişkeni oluyor.
 */
export function getStore(): CatalogStore {
  return process.env.BLOB_READ_WRITE_TOKEN ? blobStore : fsStore;
}

export type { CatalogStore };
