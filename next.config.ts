import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
