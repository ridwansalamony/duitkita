import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "DuitKita",
    short_name: "DuitKita",
    description: "Ruang keuangan bersama untuk Anda dan pasangan.",
    lang: "id",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7547f5",
    icons: [
      { src: "/ikon/aplikasi-192.png", sizes: "192x192", type: "image/png" },
      { src: "/ikon/aplikasi-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/ikon/aplikasi-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
