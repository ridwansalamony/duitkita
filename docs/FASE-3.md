# Fase 3 — Laporan dan persiapan rilis

Status: implementasi laporan dan persiapan production tersedia. Deployment Vercel dan pengujian akun production belum selesai.

## Implementasi

- `/laporan`: filter harian, mingguan, bulanan, dan tanggal kustom; ringkasan kategori, anggota, dompet, serta tren. Endpoint `/api/laporan` memverifikasi sesi, mengambil identitas keluarga dari server, dan memfilter setiap join dengan keluarga tersebut. Agregasi dilakukan di server dari transaksi periode yang dipilih; transfer tetap ada di rincian, tetapi tidak menambah arus kas.
- Ekspor PDF dengan nama keluarga, periode, grafik, kategori, rincian, dan nomor halaman. Font Noto Sans lokal berlisensi OFL. Excel berisi Transaksi, Summary Kategori, Summary Anggota, dan Ringkasan; nominal tetap berupa angka, teks pengguna tidak dijadikan formula.
- Metadata publik, gambar Open Graph, sitemap empat halaman publik, robots, serta JSON-LD. Halaman akun/keluarga tidak diindeks.
- Upstash membatasi login, pendaftaran, pemulihan sandi, pengaturan keluarga, unggah struk, dan laporan. Jika Redis tidak tersedia di production, request diblokir sementara. Pembatas memori hanya untuk localhost tanpa Upstash.
- CSP dan header keamanan. Analytics dan Speed Insights hanya mengukur empat halaman publik; URL query dan fragment dibuang. Aktivasi layanan tetap dilakukan di dashboard Vercel.
- `vercel.json`: region `sin1`, Next.js, pnpm frozen lockfile. Node 24 dan pnpm 11.19.0 sesuai runtime lokal. PostCSS dipatok melalui override versi perbaikan.

File utama: `src/db/reports.ts`, `src/lib/reports.ts`, `src/lib/report-export.ts`, `src/features/reports/reports.tsx`, `src/lib/security/rate-limit.ts`, `src/lib/seo.ts`, `src/components/shared/telemetry.tsx`, route metadata di `src/app`, `scripts/check-production.mjs`, dan `vercel.json`.

## Verifikasi 3 Oktober 2026

- Build production, lint, dan pengujian SQL/PGlite lulus. SQL meliputi isolasi dua keluarga, akses pasangan, saldo kurang, transfer, audit, budget, dan target unik.
- Ekspor Excel dibuka kembali dan totalnya dibandingkan; PDF berhasil di-render dua halaman dan diperiksa secara visual.
- Tiga tes pembatas request lulus: batas percobaan, pemisahan identitas, konfigurasi production tidak lengkap, timeout, dan penolakan Upstash.
- Dua tes HTTP build live lulus: laporan/snapshot menolak pengguna anonim; sitemap, robots, JSON-LD, OG PNG, noindex akun, dan header keamanan tersedia.
- Worker Tesseract nyata dan alur kegagalan/pembatalan lulus di demo. Tes UI CRUD, avatar, target, budget, sinkronisasi, dan logout lulus. Grafik dipisahkan menjadi modul browser dengan skeleton; grafik tren memakai ukuran responsif langsung dan diagram lingkaran memakai ukuran eksplisit.
- Koneksi Upstash nyata memberi PONG. Kedua index `tx_family_date_idx` dan `audit_family_idx` ditemukan pada Supabase.
- Audit dependensi production tidak menemukan kerentanan yang diketahui saat pemeriksaan.

Pengujian registrasi dengan email verifikasi, dua akun live lintas keluarga, Storage live, dan Realtime lintas browser masih harus dituntaskan sebelum Fase 3 dinyatakan selesai. Tes demo/PGlite tidak membuktikan seluruh konfigurasi layanan production.

Pemeriksaan lanjutan 4 Oktober 2026: build production live lulus. Tes responsif desktop/mobile pada build production demo lulus tiga kali berturut-turut. Server development masih menunjukkan render grafik yang tidak konsisten selama pengujian; hasil production diperiksa terpisah. Pemisahan modul grafik mengurangi JavaScript awal dasbor dari sekitar 310 KB menjadi 195 KB dan laporan dari 332 KB menjadi 217 KB.

Hasil akhir regresi: **44 tes demo/unit/OCR lulus**, enam tes khusus live sengaja dilewati pada server demo, kemudian **keenam tes live lulus** pada server production lokal port 3000. Tidak ada tes gagal pada kedua rangkaian production tersebut. Nilai rahasia `.env.local` tidak ditemukan pada 188 file yang diperiksa sebelum commit; `.env.local`, build, cache, dan hasil tes sementara diabaikan Git.

## Deployment melalui browser (tanpa CLI Vercel)

1. Masuk ke https://vercel.com/new dengan akun tujuan. Import repository `ridwansalamony/duitkita`, beri nama proyek `duitkita`, pilih Next.js dan root `./`.
2. Masukkan variabel dari `.env.local` ke Environment Variables Vercel secara langsung; jangan commit berkas tersebut. Gunakan `NEXT_PUBLIC_APP_MODE=live`. Ganti `NEXT_PUBLIC_APP_URL` dengan domain HTTPS yang benar-benar diberikan Vercel, bukan localhost. Nama proyek tidak menjamin domain `duitkita.vercel.app` tersedia.
3. Isi URL/key Supabase, `DATABASE_URL`, bucket `receipts`, dan dua variabel Upstash. `DIRECT_URL` untuk migrasi administratif; aplikasi runtime memakai `DATABASE_URL`. Gunakan transaction pooler Supabase port 6543 untuk runtime serverless jika tersedia, `prepare:false` sudah disiapkan. Jangan mengganti password atau hostname dengan tebakan; ambil URL dari menu Connect Supabase.
4. `SUPABASE_SERVICE_ROLE_KEY` hanya untuk administrasi server. Jangan pernah menambahkan prefiks `NEXT_PUBLIC_` pada database URL, service-role key, atau token Upstash.
5. Deploy, lalu di Supabase Auth atur Site URL dan allowlist redirect ke domain production serta `/autentikasi/konfirmasi`. Periksa Auth Hook dan bucket privat sesuai Fase 2. Aktifkan Analytics dan Speed Insights di Vercel bila diperlukan.
6. Jika domain baru diketahui setelah deploy pertama, perbarui `NEXT_PUBLIC_APP_URL` dan redeploy agar metadata serta tautan email memakai domain benar.
7. Jalankan pemeriksaan akun, CRUD, OCR, laporan, audit, dan isolasi dua keluarga pada URL final. Jangan memakai akun atau data keuangan nyata untuk fixture pengujian otomatis.

`pnpm check:production` memeriksa konfigurasi tanpa menampilkan nilai rahasia. Jalankan dengan environment production yang benar; `.env.local` untuk development memang boleh memakai localhost sehingga pemeriksaan ini gagal untuk URL lokal.

Referensi: [impor Git Vercel](https://vercel.com/docs/git), [environment variables](https://vercel.com/docs/environment-variables).
