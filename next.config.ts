import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /**
       * Sunucu eylemlerinin gövde sınırı varsayılan olarak 1 MB ve bu,
       * tek bir telefon fotoğrafına bile yetmiyordu.
       *
       * Fotoğraflar artık tarayıcıda küçültülüp webp'ye çevrilerek
       * gönderiliyor (bkz. foto-kucult.ts), dolayısıyla bir seferde birkaç
       * fotoğraf rahatça sığıyor. 4 MB, sunucu tarafındaki dosya başına
       * sınırla aynı hizada ve barındırma platformunun kendi gövde
       * sınırının altında kalıyor.
       */
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
