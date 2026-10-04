import { siteUrl } from "@/lib/seo";
import { Telemetry } from "@/components/shared/telemetry";
import type { Metadata, Viewport } from "next";
import { InstallApp } from "@/components/shared/install-app";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});
export const metadata: Metadata = {
  appleWebApp: { capable: true, title: "DuitKita", statusBarStyle: "default" },
  icons: { apple: "/ikon/apple-touch-icon.png" },
  metadataBase: new URL(siteUrl()),
  title: {
    default: "DuitKita — Uang berdua, tercatat berdua",
    template: "%s — DuitKita",
  },
  description:
    "Ruang keuangan bersama untuk Anda dan pasangan. Catat pengeluaran, wujudkan impian, dan tumbuh bersama.",
};
export const viewport: Viewport = { themeColor: "#7547f5" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable}`}>
        <Providers>
          {children}
          <InstallApp />
        </Providers>
        {process.env.VERCEL_ENV === "production" && <Telemetry />}
      </body>
    </html>
  );
}
