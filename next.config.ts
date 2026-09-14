import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /**
       * Sunucu eylemlerinin gövde sınırı varsayılan olarak 1 MB.
       * Panel 6 MB'a kadar fotoğraf kabul ettiğini söylüyor, dolayısıyla
       * telefon fotoğrafları (2-5 MB) eyleme hiç ulaşamadan çerçeve
       * tarafından reddediliyordu — kullanıcı yalnızca boş bir sunucu
       * hatası görüyordu. 8 MB, 6 MB'lık uygulama sınırının üstünde:
       * multipart gövdesinin sınır/başlık yükü için pay bırakıyor.
       */
      bodySizeLimit: "8mb",
    },
  },
  images: {
    remotePatterns: [
      {
        // Ürün fotoğrafları canlıda Vercel Blob'da durur; next/image'in
        // bu alan adını optimize etmesine izin veriyoruz.
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
