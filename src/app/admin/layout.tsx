import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import "../globals.css";

/**
 * Admin panelinin kendi kök yerleşimi.
 *
 * Genel site `[locale]` altında kendi <html>'ini kuruyor; panel dil
 * önekine tabi değil ve site başlığı/altbilgisi/seçki dock'u burada
 * istenmiyor, o yüzden ayrı bir kök.
 */

const cosmos = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-cosmos",
  display: "swap",
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: "Yönetim — YSMN",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-scroll-behavior="smooth" className={cosmos.variable}>
      <body data-mode="kadin" className="min-h-screen bg-ground">
        {children}
      </body>
    </html>
  );
}
