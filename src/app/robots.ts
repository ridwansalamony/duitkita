import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  if (
    process.env.VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_APP_MODE === "demo"
  )
    return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/fitur", "/tentang", "/kontak"],
      disallow: [
        "/api/",
        "/dashboard",
        "/transaksi",
        "/dompet",
        "/kategori",
        "/tabungan",
        "/laporan",
        "/riwayat-aktivitas",
        "/pengaturan$",
        "/pengaturan/",
        "/pengaturan-awal",
        "/profil",
        "/pemilik",
        "/undang/",
        "/autentikasi/",
      ],
    },
    sitemap: siteUrl() + "/sitemap.xml",
  };
}
