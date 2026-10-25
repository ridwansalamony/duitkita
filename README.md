# DuitKita

Aplikasi keuangan pasangan berdasarkan [PRD.md](./PRD.md), memakai Next.js 15, Supabase, Drizzle, Tailwind, dan shadcn/ui. Laporan PDF/Excel tersedia. Konfigurasi database dijelaskan dalam [panduan database](./docs/FASE-2.md); panduan PWA, SEO, dan keamanan tersedia di `docs/`.

## Menjalankan

```sh
npm ci
npm run dev
```

Gunakan Node.js 24 dan npm 11 atau lebih baru. `npm ci` memasang versi dari `package-lock.json`; gunakan `npm install` ketika mengubah dependency. Mitigasi dependency tooling dipasang otomatis melalui `postinstall`. Konfigurasi `.npmrc` mengizinkan dependency URL yang dideklarasikan langsung pada proyek, untuk paket SheetJS resmi.

Buka [http://localhost:3000](http://localhost:3000). Mode default adalah **live**: isi `.env.local`, jalankan migrasi, aktifkan Auth Hook sesuai [panduan Fase 2](./docs/FASE-2.md), lalu daftar/masuk. Host database langsung membutuhkan dukungan jaringan IPv6; gunakan Session Pooler dari menu Connect Supabase jika host tersebut tidak dapat dijangkau.

Untuk pratinjau Fase 1 tanpa layanan eksternal, set `NEXT_PUBLIC_APP_MODE=demo` sebelum menjalankan dev/build. Dasbor demo tersedia tanpa akun dengan data Budi & Sari. Mode ini tidak dipakai sebagai fallback ketika koneksi database gagal.

```sh
npm run db:generate
npm run db:check
npm run db:migrate
npm run test:db
```

```sh
npm run typecheck
npm run lint
npm run build
npm start
```

Pengujian regresi browser, dengan server **mode demo** berjalan di port 3000:

```sh
npm run test:e2e
```

Konfigurasi pengujian memakai Chrome yang terpasang (`channel: "chrome"`). Untuk lingkungan CI, instal browser Playwright dan sesuaikan channel. Screenshot hasil berada di `test-results/screenshots/` dan tidak masuk Git.

Untuk uji proteksi publik mode live, jalankan `E2E_LIVE=1` pada proses pengujian dan pilih `tests/phase-two-public.spec.ts`. `PLAYWRIGHT_BASE_URL` dapat mengubah URL pengujian. Pada PowerShell, set variabel dengan `$env:E2E_LIVE='1'`. Jangan menjalankan tes demo terhadap database live.

## OCR tanpa API berbayar

Tesseract.js membaca foto di browser dengan model Indonesia dan Inggris. `npm run dev` dan `npm run build` otomatis menyalin worker, WASM, dan model dari dependensi ke `public/ocr/`; jalankan `npm run ocr:prepare` jika menggunakan perintah Next langsung. Berkas hasil salinan diabaikan Git dan dibuat ulang saat build. Foto tidak dikirim ke penyedia OCR; pada mode live hanya diunggah ke bucket privat Supabase. Tidak perlu mengisi `OPENAI_API_KEY`; nilai lama di `.env.local` tidak digunakan.

Saran total, tanggal, dan toko tidak menimpa isian sampai **Gunakan Saran** ditekan. Proses bisa dihentikan; kegagalan tidak menghapus lampiran. Pembacaan pertama memuat model dan dapat lebih lama, dengan batas tunggu 60 detik. Akurasi foto buram dan struk beragam belum dijamin.

Uji parser: `npx --no-install playwright test tests/receipt-parser.spec.ts`. Untuk uji browser dengan worker nyata, jalankan server demo lalu set `$env:E2E_OCR='1'` dan jalankan `npx --no-install playwright test tests/receipt-ocr.spec.ts`.

## Stack

- Next.js **15.5.28**, App Router, React 19, TypeScript strict.
- Tailwind CSS v4, shadcn/ui (Radix), Lucide, Recharts, Framer Motion.
- Plus Jakarta Sans dan Inter melalui `next/font`, tema terang/gelap melalui next-themes.
- npm dengan package-lock.json; Playwright untuk alur antarmuka.
- Supabase Auth/Postgres/Storage/Realtime, Drizzle ORM, PostgreSQL client, Zod, dan Tesseract.js untuk OCR lokal di browser tanpa API key.
- PGlite menguji SQL/RLS secara lokal. jsPDF dan SheetJS menghasilkan ekspor; Pembatas request memakai memori per instance, dengan batas tulis tambahan di database.

## Struktur

Folder rute dan URL menggunakan bahasa Indonesia, dengan pengecualian `dashboard`, grup `(app)` / `(public)`, serta parameter undangan `[code]`. Rute akun: `/masuk`, `/daftar`, `/lupa-kata-sandi`, `/pengaturan-awal`. Rute pengelolaan: `/tabungan`, `/riwayat-aktivitas`, `/profil`, `/pemilik/dashboard`, dan `/pemilik/anggota`. Detail transaksi dan tabungan menggunakan parameter `[id]`. Nama file khusus Next.js seperti `page.tsx`, `layout.tsx`, dan `loading.tsx` tetap mengikuti konvensi framework.

```text
src/app/(public)/       Halaman publik, autentikasi, pengaturan awal, undangan
src/app/(app)/          Halaman pengguna dan admin dengan layout persisten
src/components/ui/     Komponen shadcn/ui
src/components/layouts/ Navigasi publik, sidebar, header, drawer, bottom nav
src/components/shared/ Format rupiah, badge kategori, ikon, judul, empty state
src/features/          Komponen dan interaksi tiap fitur
src/lib/dummy/         Model, data contoh, state sesi, helper berlingkup keluarga
src/db/                Skema, konteks RLS, dan query Drizzle
src/actions/           Server Actions autentikasi dan keuangan
src/lib/workspace/     Provider data langsung, optimistic UI, Realtime
src/lib/supabase/      Client Supabase server dengan cookie HttpOnly
src/lib/receipts/      Resize, upload, dan OCR struk
supabase/migrations/   Migrasi tabel, RLS, trigger, seed keluarga, Storage
scripts/               Pemeriksaan/migrasi database dan pengujian SQL
public/receipts/       Struk ilustrasi lokal
tests/                 Pemeriksaan rute dan alur pengguna dengan Playwright
docs/                  Panduan database, PWA, SEO, dan keamanan
```

## Perilaku demo

- Perubahan data bertahan selama navigasi client dalam sesi halaman, lalu kembali ke seed saat reload. Tema terang/gelap tersimpan di browser.
- Data transaksi memakai September 2026 agar laporan, grafik, dan filter awal konsisten. Saldo pembukaan berupa transaksi pemasukan; saldo dompet merupakan agregat transaksi, termasuk transfer masuk dan keluar.
- Semua helper data menyaring keluarga. Semua anggota keluarga mengakses dompet yang sama; keluarga lain tidak dapat mengaksesnya.
- **Pembatasan UI demo bukan keamanan produksi.** Mode demo memakai seed contoh di browser. Mode live menggunakan autentikasi server dan RLS Supabase.
- Target tabungan mengikuti saldo dompet terhubung. Transfer tabungan tidak dihitung sebagai pemasukan/pengeluaran dan tidak mengurangi saldo total keluarga.
- CRUD transaksi, dompet, kategori, target, profil, undangan, dan keanggotaan bekerja di memori sesi. Mutasi demo mencatat riwayat aktivitas.
- Dompet dengan riwayat tidak dapat dihapus. Kategori yang dihapus memindahkan transaksi ke “Lainnya” dengan tipe yang sesuai. Target dapat diubah; fitur arsip dan hapus target tidak tersedia. Dompet utama dan dompet terhubung target tidak dapat dihapus.
- Auth, reset password, dan kontak hanya simulasi; tidak mengirim email atau menyimpan kata sandi. Kode undangan awal: `DUIT-XY7A`.
- JPG/PNG struk dibaca oleh Tesseract.js di browser, termasuk pada demo. Hasil berupa saran yang harus diperiksa sebelum diterapkan. Tombol **Tampilkan Contoh Hasil OCR** tetap tersedia terpisah sebagai simulasi. Ekspor PDF/Excel menggunakan laporan periode yang dipilih.

## Catatan arsitektur Fase 2

1. Skema Bab 10 tetap menjadi acuan. `saving_goals.wallet_id` wajib mengacu dompet keluarga yang sama; `saving_contributions` dipertahankan hanya sebagai arsip lama; tabel `families` menggunakan `id` sebagai identitas tenant. Referensi lintas tabel harus diverifikasi berada di keluarga yang sama.
2. `family_id` berasal dari keanggotaan tepercaya di server. Custom JWT claim memerlukan Auth Hook/flow penerbitan token yang benar; jangan mempercayai family ID dari form atau sekadar menyuntikkan claim di middleware.
3. Koneksi Drizzle tidak boleh mengabaikan RLS melalui role istimewa. Sediakan konteks autentikasi transaksi database yang benar, policy keluarga, Storage, audit log, dan agregasi yang tidak membocorkan data lintas keluarga.
4. `decimal(15,2)` menampung 13 digit integer dan 2 desimal. Form demo mengikuti batas tersebut. Penyimpanan produksi menggunakan nilai desimal presisi, bukan hitungan floating point JavaScript.
5. Transfer tabungan dan mutasi transaksi perlu transaksi database atomik beserta audit log; bootstrap keluarga dan default category perlu jalur otorisasi khusus yang tidak membuka akses lintas keluarga.

Pengujian database dan browser tersedia di `scripts/` dan `tests/`. Jalankan pengujian dengan mode dan lingkungan yang sesuai; fixture demo tidak boleh dijalankan terhadap data production.

## Keamanan dan pembersihan lokal

Lihat [review keamanan](./docs/REVIEW-KEAMANAN.md) untuk temuan, perbaikan, batas pengujian dan migrasi `0008_nominal_finite.sql`. Migrasi yang baru disiapkan tidak otomatis diterapkan ke Supabase.

`npm run test:security` menguji upload, pembatas request, identitas server dan mitigasi dependency tanpa koneksi database eksternal. `npm run test:db` memakai PostgreSQL lokal sementara melalui PGlite. Audit dependensi: `npm audit --omit=dev` dan `npm audit`.

Setelah menghentikan server lokal, lihat artefak yang akan dibuang dengan `npm run clean -- --dry-run`, lalu jalankan `npm run clean`. Gunakan `npm run clean -- --tests` bila hasil pengujian juga ingin dibuang. Script hanya menghapus daftar artefak yang ditetapkan, menolak symlink/junction, dan tidak menyentuh source, `.env.local`, `node_modules`, atau database. Jalankan dev/build kembali sesudah pembersihan; typecheck membuat ulang definisi route melalui `next typegen`.
