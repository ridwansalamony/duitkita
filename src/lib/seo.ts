import type { Metadata } from "next";
import { appUrl } from "./app-url";
export const siteUrl = appUrl;
export const publicPages = {
  "/": {
    title: "Aplikasi Keuangan Keluarga dan Pasangan",
    description:
      "Kelola keuangan keluarga bersama pasangan dengan DuitKita. Catat pemasukan dan pengeluaran, pantau anggaran bulanan, dan capai target tabungan bersama.",
  },
  "/fitur": {
    title: "Fitur Pengelolaan Keuangan Keluarga",
    description:
      "Jelajahi fitur DuitKita: dompet bersama, pencatatan transaksi, pemindaian struk, anggaran bulanan, laporan keuangan, dan target tabungan keluarga.",
  },
  "/tentang": {
    title: "Tentang DuitKita dan Keuangan Bersama",
    description:
      "Kenali DuitKita, ruang keuangan bersama agar pasangan lebih mudah merencanakan masa depan keluarga.",
  },
  "/kontak": {
    title: "Kontak dan Bantuan",
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
      title: `${name} - DuitKita`,
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
      title: `${name} - DuitKita`,
      description,
      images: [siteUrl() + "/opengraph-image"],
    },
  };
}
