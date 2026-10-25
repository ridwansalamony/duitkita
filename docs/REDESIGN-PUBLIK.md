# Audit redesign publik DuitKita

Tanggal: 21 Oktober 2026. Status: **belum selesai untuk rilis**. Satu pemeriksaan Pre-Flight masih FAIL pada LCP mobile simulasi standar. Tidak ada commit, push, deployment, atau perubahan database.

## Lingkup dan hasil implementasi

Mode Preserve, DESIGN_VARIANCE 5, MOTION_INTENSITY 3, VISUAL_DENSITY 4. Sasaran adalah calon pengguna pasangan/keluarga yang memerlukan tampilan jelas, hangat, dan dapat dipercaya. Tuas modernisasi: tipografi/hierarki, spacing, variasi komposisi, gambar produk asli, konsistensi CTA, dan umpan balik interaksi. Dashboard, transaksi keuangan, autentikasi, dan database berada di luar perubahan desain.

Beranda, Fitur, Tentang Kami dan Kontak diperbarui. Hero lebih ringkas, bento tiga sel dengan satu sel lebar, artikel fitur dua kolom, nilai About berupa baris terbuka, menu mobile terstruktur, dan CTA mengikuti tema. Screenshot berasal dari aplikasi demo Budi & Sari. Kontak tetap mempertahankan simulasi kirim existing, bukan integrasi pengiriman baru.

Komponen logo, ikon publik, dan form kontak dipisahkan agar halaman publik tidak ikut memuat modul dashboard. Prefetch tautan publik dimatikan untuk menghindari pemuatan dini bundle autentikasi/dashboard. Gambar menggunakan ukuran eksplisit, sumber responsif, prioritas hero, lazy loading gambar berikutnya dan varian tema. Percobaan lazy menu tidak memberi manfaat terukur dan telah dibatalkan.

## Audit em-dash

PASS pada empat halaman publik, menu, copy, alt, atribusi, dan legal yang disentuh: nol karakter dash panjang maupun double dash sebagai tipografi. Sintaks CSS custom properties tetap memakai dua tanda minus karena merupakan kode, bukan copy UI.

## Pre-Flight Section 14

PASS berarti pemeriksaan lokal dalam lingkup ini, bukan sertifikasi semua browser atau produksi. N/A diberi alasan kontekstual. Pengecualian brand existing mengikuti instruksi pengguna dan Section 11 Preserve.

| No  | Pemeriksaan                                            | Hasil | Bukti / alasan                                                                                                                                                         |
| --- | ------------------------------------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Brief inference                                        | PASS  | Halaman publik produk keuangan keluarga, pendekatan hangat dan terpercaya; dashboard di luar lingkup.                                                                  |
| 2   | Dial values                                            | PASS  | Variance 5, Motion 3, Density 4; mempertahankan identitas dan membatasi animasi dekoratif.                                                                             |
| 3   | Design system                                          | PASS  | Tailwind dan shadcn/ui/Radix yang sudah digunakan.                                                                                                                     |
| 4   | Redesign mode                                          | PASS  | Preserve; audit Section 11.B dan deklarasi Section 11.D telah disampaikan sebelum implementasi.                                                                        |
| 5   | ZERO em-dashes (`dash panjang`) anywhere on the page.  | PASS  | Teks terlihat pada empat halaman dalam dua tema diperiksa tes; sumber copy, alt, menu dan legal diperiksa tanpa dash panjang.                                          |
| 6   | Page Theme Lock                                        | PASS  | Semua section mengikuti tema halaman; gambar produk memiliki versi terang dan gelap.                                                                                   |
| 7   | Color Consistency Lock                                 | PASS  | Accent primary ungu yang sama; tidak menambah palet fitur warna-warni pada permukaan publik.                                                                           |
| 8   | Shape Consistency Lock                                 | PASS  | Token radius dasar 12px dipertahankan; kontrol 12px, panel 16px, tombol ikon bulat.                                                                                    |
| 9   | Button Contrast Check                                  | PASS  | CTA primary memakai primary-foreground; axe dan inspeksi visual dua tema tanpa temuan kontras.                                                                         |
| 10  | CTA Button Wrap                                        | PASS  | Label CTA desktop satu baris; ukuran dan tata letak diperiksa pada 1024 dan 1440px.                                                                                    |
| 11  | Form Contrast Check                                    | PASS  | Label, placeholder, input dan focus ring memakai token; axe kontak dua tema tanpa pelanggaran.                                                                         |
| 12  | Serif discipline                                       | N/A   | Tidak menggunakan serif.                                                                                                                                               |
| 13  | Premium-consumer palette check                         | N/A   | Bukan produk artisan/luxury; palet keluarga DuitKita dipertahankan.                                                                                                    |
| 14  | Italic descender clearance                             | N/A   | Tidak menambahkan teks italic.                                                                                                                                         |
| 15  | Hero fits the viewport                                 | PASS  | Hero beranda maksimal dua baris desktop, subtext 18 kata; CTA dan hero muat pada viewport uji 1000px. Judul halaman internal dipertahankan.                            |
| 16  | Hero top padding                                       | PASS  | Hero beranda lg:py-16, tidak melebihi pt-24.                                                                                                                           |
| 17  | Hero stack discipline                                  | PASS  | Hero beranda empat elemen: eyebrow, H1, deskripsi, kelompok CTA; manfaat dipindah ke section sendiri.                                                                  |
| 18  | EYEBROW COUNT (mechanical)                             | PASS  | Beranda 0 label uppercase-tracking dekoratif; satu eyebrow biasa. Halaman lain maksimal satu eyebrow per halaman, dalam batas ceil(section/3).                         |
| 19  | Split-Header Ban                                       | PASS  | Heading section dan deskripsi ditumpuk vertikal; CTA akhir merupakan kelompok aksi tersendiri.                                                                         |
| 20  | Zigzag Alternation Cap                                 | PASS  | Tidak ada tiga section berurutan dengan pola split yang sama.                                                                                                          |
| 21  | No Duplicate CTA Intent                                | PASS  | Tujuan sama diberi label sama sesuai izin: Fitur, Tentang Kami, Kontak, Mulai Bersama, Lihat Demo. Pengulangan navigasi dan CTA akhir tetap fungsional.                |
| 22  | Logo wall = logo only                                  | N/A   | Tidak ada logo wall.                                                                                                                                                   |
| 23  | Bento Background Diversity                             | PASS  | Tiga sel bento: tint sekunder, netral, dan sel lebar dengan screenshot nyata.                                                                                          |
| 24  | "Used by / Trusted by" logo wall                       | N/A   | Tidak ada klaim trusted-by atau logo pelanggan rekaan.                                                                                                                 |
| 25  | Copy Self-Audit                                        | PASS  | Copy dibaca ulang; klaim fase berikutnya diperbarui. Quote Budi dan Sari diberi label keluarga demo, bukan testimoni pelanggan.                                        |
| 26  | Motion motivated                                       | PASS  | Transisi hover/press, menu, accordion dan pilihan tema memberi umpan balik; tidak ada animasi latar tanpa tujuan.                                                      |
| 27  | Marquee max-one-per-page                               | N/A   | Tidak ada marquee.                                                                                                                                                     |
| 28  | Navigation on ONE line                                 | PASS  | Header 72px ditambah border, satu baris; navigasi beralih ke menu di bawah lg.                                                                                         |
| 29  | Section-Layout-Repetition                              | PASS  | Hero split, strip manfaat, bento, quote, FAQ accordion, CTA dan footer menggunakan keluarga tata letak berbeda.                                                        |
| 30  | Bento has rhythm AND exact cell count                  | PASS  | Tepat tiga fitur pada bento beranda, tanpa sel kosong; enam fitur di halaman fitur berupa grid dua kolom.                                                              |
| 31  | Long lists use the right UI component                  | PASS  | Enam fitur memakai artikel dua kolom; pertanyaan memakai accordion, bukan daftar panjang berulang.                                                                     |
| 32  | Real images used                                       | PASS  | Enam screenshot produk asli dari demo Budi dan Sari; tidak menggunakan screenshot palsu dari div atau aset AI.                                                         |
| 33  | No pills/labels overlaid on images                     | PASS  | Tidak menempelkan label dekoratif pada gambar. Tulisan di dalam screenshot adalah UI produk asli.                                                                      |
| 34  | No photo-credit captions as decoration                 | PASS  | Tidak ada kredit foto dekoratif.                                                                                                                                       |
| 35  | No version footers                                     | PASS  | Footer merek dan copyright asli tanpa versi build.                                                                                                                     |
| 36  | No micro-meta-sentences                                | PASS  | Tidak ada micro-meta yang mengomentari proses desain.                                                                                                                  |
| 37  | No decoration text strip at hero bottom                | PASS  | Strip manfaat memiliki isi fungsional dan berada di luar hero.                                                                                                         |
| 38  | No floating top-right sub-text                         | PASS  | Tidak ada subtext melayang di kanan atas heading.                                                                                                                      |
| 39  | No scoring/progress bars with filled background tracks | N/A   | Tidak menambah bar perbandingan. Progress di dalam screenshot adalah fungsi produk asli.                                                                               |
| 40  | No locale / city-name / time / weather strips          | N/A   | Tidak ada strip kota, cuaca, atau waktu.                                                                                                                               |
| 41  | No scroll cues                                         | N/A   | Tidak ada scroll cue.                                                                                                                                                  |
| 42  | No version labels in hero                              | N/A   | Tidak ada versi/BETA di hero.                                                                                                                                          |
| 43  | No section-numbering eyebrows                          | N/A   | Tidak ada penomoran section dekoratif.                                                                                                                                 |
| 44  | No decorative dots                                     | PASS  | Tidak menambah titik dekoratif. Titik wordmark dipertahankan sebagai logo sesuai instruksi pengguna.                                                                   |
| 45  | No `border-t` + `border-b` on every row                | PASS  | Tidak memberi dua garis pada setiap baris panjang; pemisah FAQ dan nilai About digunakan seperlunya.                                                                   |
| 46  | Content density                                        | PASS  | Tidak ada tabel data panjang atau metrik pemasaran rekaan; angka screenshot adalah data demo yang ditandai.                                                            |
| 47  | Quotes ≤ 3 lines                                       | PASS  | Quote menjadi cuplikan asli Sekarang tinggal lihat bareng, maksimal tiga baris; atribusi Budi & Sari, keluarga demo.                                                   |
| 48  | Motion claimed = motion shown                          | N/A   | Motion 3; tidak menjanjikan animasi intensif.                                                                                                                          |
| 49  | GSAP sticky-stack / horizontal-pan                     | N/A   | Tidak menggunakan GSAP, sticky-stack, atau horizontal-pan.                                                                                                             |
| 50  | No `window.addEventListener('scroll')`                 | PASS  | Tidak menambah scroll listener.                                                                                                                                        |
| 51  | Reduced motion                                         | PASS  | Override prefers-reduced-motion yang ada dipertahankan dan press/hover publik juga menghormatinya.                                                                     |
| 52  | Dark mode                                              | PASS  | Empat halaman diuji light/dark; gambar mengikuti tema sistem maupun manual.                                                                                            |
| 53  | Mobile collapse                                        | PASS  | Lebar 320, 390, 768, 1024, 1440px diuji tanpa overflow horizontal.                                                                                                     |
| 54  | Viewport stability                                     | PASS  | Tidak menggunakan h-screen pada permukaan baru; konten mengikuti tinggi alami.                                                                                         |
| 55  | `useEffect` animations                                 | N/A   | Tidak menambah effect animasi.                                                                                                                                         |
| 56  | Empty / loading / error                                | PASS  | Validasi kontak, keadaan sesudah kirim, reset, menu dan tema diuji; perilaku error aplikasi yang ada tidak diubah.                                                     |
| 57  | Cards omitted                                          | PASS  | Nilai About menjadi baris terbuka; enam fitur memakai artikel tanpa kartu penuh.                                                                                       |
| 58  | Icons                                                  | PASS  | Lucide yang sudah dipakai proyek tetap digunakan. Ini pengecualian preservasi stack/icon existing, bukan penambahan SVG dekoratif; SVG logo asli dipertahankan persis. |
| 59  | Motion                                                 | N/A   | Tidak menambah library motion; interaksi CSS dan Radix client leaf yang sudah ada.                                                                                     |
| 60  | No AI Tells                                            | PASS  | Ungu, Inter, dan logo adalah identitas existing yang wajib dipertahankan pada mode Preserve. Tidak ada tiga kartu identik, Acme, Jane Doe, atau fake social proof.     |
| 61  | Core Web Vitals                                        | FAIL  | LCP mobile simulasi standar 3,0s masih di atas 2,5s. Throttling langsung 2,1s tidak menghapus kegagalan simulasi. INP lapangan belum tersedia; TBT bukan INP.          |
| 62  | One design system                                      | PASS  | Hanya sistem Tailwind/shadcn yang sudah digunakan; tidak memasang design system lain.                                                                                  |

## Audit preservasi

- URL berubah: []
- Label primary nav berubah: []
- Nama dan urutan field form berubah: []
- Anchor berubah: []
- Logo/wordmark berubah: []
- Legal copy berubah: []

Rute /, /fitur, /tentang, /kontak serta /tentang#privasi tetap. Primary nav tetap Fitur, Tentang Kami, Kontak, Masuk, Mulai Bersama. Field kontak tetap name, email, subject, message dalam urutan tersebut. Heading utama keempat halaman, metadata SEO, sitemap, robots, providers dan dua versi legal privasi dipertahankan. Pemeriksaan sumber membandingkan baseline dan body fungsi Logo asli, bukan hanya nama berkas.

Perubahan copy yang sudah diizinkan: Fitur lengkap menjadi Fitur; Kenali lebih dekat menjadi Fitur; Cerita kami menjadi Tentang Kami; Hubungi kami menjadi Kontak; Buat akun menjadi Mulai Bersama; Jelajahi demo/Buka demo menjadi Lihat Demo dalam mode demo; Masuk ke akun menjadi Masuk. Kalimat fitur yang masih menyebut fase berikutnya diselaraskan dengan fitur yang sudah tersedia.

## Audit kesetiaan merek

PASS: primary terang hsl(258 90% 60%) dan gelap hsl(258 95% 73%) tetap; Inter untuk isi dan Plus Jakarta Sans untuk heading tetap. Fungsi logo dipindah ke brand-logo.tsx dengan body identik, bukan digambar ulang. Neutral publik terang disesuaikan sedikit ke off-white; token root dan dark aplikasi tetap. Tombol CTA publik memakai solid primary; UI aplikasi tetap memakai style existing. favicon.ico berasal dari ikon aplikasi existing.

## Verifikasi dan performa

- Build produksi lokal mode demo: PASS.
- Typecheck: PASS. Lint file perubahan: PASS.
- Playwright: **37/37 PASS**, termasuk 12 tes preservasi publik dan 25 regresi PWA/tema/saldo/tabungan/laporan/feedback/isolasi niat mutasi.
- Axe WCAG 2A/AA dan 2.1AA: **10 pemeriksaan, nol pelanggaran**, empat halaman kali dua tema ditambah menu mobile dua tema. Ini bukan pengganti pengujian aksesibilitas manual menyeluruh.
- Inspeksi screenshot desktop terang serta About mobile gelap dilakukan; gambar nyata, tema dan tata letak telah diperiksa.
- First Load JS halaman utama: sekitar **221 kB menjadi 145 kB** pada build lokal.

| Lighthouse lokal                              | Performance | LCP   | TBT    | CLS   |
| --------------------------------------------- | ----------- | ----- | ------ | ----- |
| Mobile, throttling DevTools langsung, final   | 96          | 2,1 s | 140 ms | 0,008 |
| Mobile, simulasi standar, final               | 95          | 3,0 s | 40 ms  | 0,001 |
| Desktop, build sebelumnya dalam pekerjaan ini | 100         | 0,6 s | 0 ms   | 0     |

Accessibility dan Best Practices final masing-masing 100 pada kedua metode mobile. SEO demo 69 karena robots mode demo memang melarang indexing; bukan bukti ranking produksi menurun, dan robots tidak diubah untuk menaikkan skor. Pengukuran memakai production build Next yang disajikan lokal lewat HTTP, Chrome headless, Lighthouse 13.5.0. Hasil dipengaruhi metode throttling dan cache. Tidak tersedia data INP pengguna nyata, ranking Search Console, maupun pengukuran deployment VPS baru.

Bukti lokal berada di test-results/design-audit/: preservation-final.json, accessibility-final.json, lighthouse-final-direct.json, lighthouse-final-simulated.json, dan preview-*.png. Artefak diabaikan Git. Tes reproduksi di tests/public-preserve.spec.ts ditambahkan ke workflow quality.

## Pekerjaan tersisa

Target LCP mobile simulasi belum terpenuhi meskipun bundle dan permintaan jaringan sudah dikurangi. Perlu mengisolasi pengaruh transport/cache terhadap jalur render dan mengukur ulang tanpa mengubah isi atau menyembunyikan konten. Belum boleh menyatakan Step 4 PASS atau siap rilis. SKILL.md Section 14 menyatakan: "If a single checkbox cannot be honestly ticked, the page is not done. Fix it before delivering." Karena itu perubahan disimpan lokal sebagai hasil yang dapat ditinjau, dengan status belum selesai.

## Catatan pembersihan 25 Oktober 2026

Artefak screenshot dan laporan mentah sementara di `test-results/` dibersihkan dalam audit source berikutnya untuk menghapus cache dan hasil kerja yang tidak perlu disimpan di proyek. Angka di atas adalah catatan pengukuran 21 Oktober 2026, bukan hasil pengukuran production terbaru. Source tes tetap tersedia untuk mereproduksi pengujian. Status LCP yang tercatat gagal tidak diubah menjadi lulus oleh pembersihan ini.
