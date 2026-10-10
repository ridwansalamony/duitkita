# SEO DuitKita

Halaman yang ditujukan untuk pencarian: beranda, fitur, tentang, dan kontak. Metadata, canonical, Open Graph, dan sitemap menggunakan `NEXT_PUBLIC_APP_URL`. Halaman akun memakai `noindex`; crawler boleh membaca halaman masuk, daftar, lupa kata sandi, dan atur kata sandi agar aturan tersebut terbaca. Data keluarga tetap dilindungi autentikasi dan RLS. Preview dan mode demo diblokir dari crawling.

## Setelah deploy

1. Pastikan `NEXT_PUBLIC_APP_URL=https://duitkita-mu.vercel.app` di Production Vercel. Jika pindah domain, ubah konfigurasi ini dan konfigurasi URL Supabase bersama-sama.
2. Buka https://search.google.com/search-console dan tambahkan properti **URL prefix** `https://duitkita-mu.vercel.app/`. Verifikasi melalui metode yang tersedia di akun, misalnya tag HTML. Jika memilih tag HTML, nilai verifikasi perlu ditambahkan ke metadata setelah token diberikan; jangan menebak nilainya.
3. Kirim `sitemap.xml` melalui menu Sitemaps. Gunakan URL Inspection untuk memeriksa beranda dan meminta pengindeksan.
4. Ukur beranda dan halaman fitur dengan https://pagespeed.web.dev/ pada mobile dan desktop. Catat LCP, INP, dan CLS; data lapangan bisa belum tersedia untuk situs baru. Telemetri Vercel Speed Insights sudah ada dalam aplikasi production, tetapi pengaktifannya perlu diperiksa di proyek Vercel.
5. Pantau laporan pengindeksan serta kueri pencarian di Search Console. Sitemap dan metadata tidak menjamin waktu indeks atau peringkat.

Tidak ada tanggal `lastModified`, ulasan, atau rating buatan. Structured data `SoftwareApplication` menjelaskan aplikasi dan tidak menjamin rich result.

Referensi: https://developers.google.com/search/docs/crawling-indexing/block-indexing dan https://developers.google.com/search/docs/appearance/title-link.
