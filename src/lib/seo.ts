import type { Metadata } from "next";
import { appUrl } from "./app-url";
export const siteUrl = appUrl;
export const publicPages = {
  "/": {
    title: "Uang berdua, tercatat berdua",
    description:
      "DuitKita membantu pasangan mencatat keuangan bersama, mengatur budget, dan menabung untuk impian keluarga.",
  },
  "/fitur": {
    title: "Fitur",
    description:
      "Catat transaksi, baca struk, pantau budget, dan wujudkan target tabungan bersama pasangan di DuitKita.",
  },
  "/tentang": {
    title: "Tentang Kami",
    description:
      "Kenali DuitKita, ruang keuangan bersama agar pasangan lebih mudah merencanakan masa depan keluarga.",
  },
  "/kontak": {
    title: "Hubungi Kami",
    description:
      "Temukan bantuan dan sampaikan masukan untuk pengalaman mencatat keuangan bersama di DuitKita.",
  },
} as const;
export function pageMetadata(path: string, title?: string): Metadata {
  const page = publicPages[path as keyof typeof publicPages];
  const name = title || page?.title || "DuitKita";
  const description =
    page?.description ||
    "Kelola akun dan ruang keuangan keluarga Anda dengan DuitKita.";
  const url = siteUrl() + path;
  return {
    title: name,
    description,
    alternates: { canonical: url },
    robots: page
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title: `${name} — DuitKita`,
      description,
      url,
      siteName: "DuitKita",
      locale: "id_ID",
      type: "website",
      images: [
        { url: siteUrl() + "/opengraph-image", width: 1200, height: 630 },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — DuitKita`,
      description,
      images: [siteUrl() + "/opengraph-image"],
    },
  };
}
