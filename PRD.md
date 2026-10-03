# DuitKita — PRD Lengkap

> Revisi mekanisme 2–3 Oktober 2026: semua dompet milik bersama; target tabungan wajib terhubung ke dompet dan mengikuti saldonya. Perubahan ini bagian Fase 2, bukan dimulainya Fase 3.

---

## 1. Ringkasan & Tujuan Aplikasi

- **Nama Aplikasi**: DuitKita
- **Penjelasan Singkat**: Aplikasi pencatatan keuangan kolaboratif untuk pasangan (suami-istri) yang memungkinkan dua orang dalam satu keluarga mengelola pemasukan, pengeluaran, target tabungan, dan laporan keuangan secara real-time dalam satu ruang data bersama (Family Workspace) yang aman dan terpisah dari pengguna lain.
- **Masalah yang Diselesaikan**:
  - Sulitnya mengetahui kondisi keuangan bersama pasangan karena catatan tersebar di aplikasi berbeda atau hanya di kepala.
  - Rawan konflik rumah tangga akibat tidak jelasnya siapa membelanjakan apa dan berapa.
  - Tidak ada riwayat aktivitas keuangan yang bisa diaudit (siapa mengubah/menghapus catatan).
  - Tidak ada alat untuk merencanakan target tabungan bersama (dana darurat, liburan, DP rumah) secara transparan.
  - Proses input transaksi dirasa merepotkan sehingga membuat orang malas mencatat.
- **Pengguna Aplikasi**:
  - **Owner (Suami/Istri pencetus)**: Membuat workspace keluarga, mengundang pasangan, mengelola kategori, melihat semua laporan, dan mengatur target tabungan keluarga.
  - **Member (Pasangan)**: Bergabung via kode undangan keluarga, mencatat transaksi di semua dompet bersama keluarga, dan melihat laporan bersama.
  - **Pengguna Baru (Keluarga Lain)**: Mendaftar sendiri dan mendapat workspace keluarga yang terisolasi penuh (multi-tenant) tanpa bisa melihat data keluarga lain.
  - **Sistem/Auditor**: Mencatat setiap aktivitas (create/update/delete) ke dalam audit log untuk transparansi.
- **Target Keberhasilan**:
  - 100% transaksi pasangan tercatat dalam satu workspace tanpa kebocoran data antar keluarga.
  - Waktu input transaksi manual < 15 detik per transaksi (termasuk kategori otomatis).
  - Upload struk berhasil mengekstrak nominal + tanggal minimal 85% akurat.
  - Laporan bulanan bisa di-export ke PDF/Excel hanya dalam 1 klik.
  - Audit log merekam minimal 100% aksi mutasi data (create/update/delete) di sistem.
  - Berhasil dideploy tanpa error di Vercel dengan cold start < 2 detik.

---

## 2. Batasan Pembuatan Sistem (Versi Awal MVP)

### ✅ Yang Dikerjakan:

- Autentikasi Email & Password (registrasi, login, reset password).
- Family Workspace multi-tenant dengan kode undangan untuk pasangan.
- Dompet Bersama (shared) untuk seluruh anggota, dengan Dompet Keluarga sebagai dompet utama.
- Pencatatan transaksi: pemasukan, pengeluaran, transfer antar dompet.
- Kategori transaksi default dan kustom (per keluarga), dengan batas budget bulanan berulang per kategori pengeluaran.
- Upload struk opsional khusus pengeluaran dengan ekstraksi otomatis nominal & tanggal via OCR (Tesseract.js di browser).
- Target tabungan yang otomatis mengikuti saldo dompet terhubung.
- Audit Log aktivitas (create/update/delete transaksi & goal).
- Rekapan: Harian, Mingguan, Bulanan, per Kategori, per Anggota.
- Filter rentang tanggal kustom + Export PDF/Excel.
- Dashboard ringkasan real-time dengan grafik tren & komposisi.
- Deploy serverless di Vercel + Supabase (Auth + Postgres + Storage).

### ⛔ Yang Tidak Dikerjakan di Versi Awal:

- Aplikasi mobile native (iOS/Android APK).
- Sinkronisasi otomatis dengan rekening bank (open banking / scraping).
- Notifikasi push & WhatsApp gateway.
- Pemindahan dana otomatis ke amplop budget; budget kategori hanya sebagai batas pemantauan, tanpa reservasi saldo atau rollover.
- Multi-currency conversion otomatis (MVP hanya IDR).
- Fitur multi-anggota lebih dari 2 orang dalam satu keluarga (MVP cukup 2, arsitektur sudah siap untuk ditambah).
- Splitting bill / utang-piutang antar anggota.

---

## 3. Daftar Halaman & Struktur Menu (Pages & Routing)

### A. Public Area (Tanpa Login)

- `/` (Landing Page): Hero, penjelasan produk, fitur unggulan, testimoni, CTA "Mulai Sekarang" & "Masuk".
- `/tentang` (Tentang DuitKita): Cerita aplikasi, misi transparansi keuangan pasangan, FAQ singkat.
- `/fitur` (Fitur Lengkap): Rincian fitur utama (transaksi, struk, saving goals, audit log, laporan).
- `/kontak` (Hubungi Kami): Form kontak (dummy) + email dukungan.
- `/masuk` (Masuk): Form email & password.
- `/daftar` (Daftar): Form nama, email, password, konfirmasi password.
- `/undang/:code` (Terima Undangan): Halaman join keluarga via kode undangan.

### B. Member/User Area (Setelah Login)

- `/pengaturan-awal` (Setup Awal): Pilih buat keluarga baru atau join via kode undangan.
- `/dashboard` (Dasbor Utama): Saldo total gabungan, saldo per dompet, transaksi terbaru, ringkasan bulan berjalan, grafik tren 7 hari.
- `/transaksi` (Daftar Transaksi): Tabel transaksi dengan filter tanggal/kategori/anggota/dompet + tombol tambah.
- `/transaksi/baru` (Catat Transaksi): Form input pemasukan/pengeluaran/transfer + upload struk opsional.
- `/transaksi/:identitas` (Detail Transaksi): Detail + bukti struk + riwayat perubahan.
- `/kategori` (Kelola Kategori): CRUD kategori (nama, tipe, ikon, warna, budget bulanan pengeluaran dan progres pemakaian).
- `/dompet` (Kelola Dompet): CRUD dompet bersama.
- `/tabungan` (Target Tabungan): Daftar & CRUD target, pilihan dompet, progres berdasarkan saldo.
- `/tabungan/:identitas` (Detail Goal): Saldo dan riwayat transaksi dompet terhubung.
- `/laporan` (Rekapan & Laporan): Pilih mode (harian/mingguan/bulanan/kategori/anggota), rentang tanggal, tombol Export PDF & Excel.
- `/riwayat-aktivitas` (Riwayat Aktivitas): Tabel log aktivitas seluruh anggota keluarga.
- `/pengaturan` (Pengaturan Keluarga): Nama keluarga, kode undangan, kelola anggota, profil pengguna.
- `/profil` (Profil Saya): Nama, email, foto profil, ganti password.

### C. Admin/Owner Area

- `/pemilik/dashboard` (Dasbor Owner): Ringkasan workspace keluarga & status anggota.
- `/pemilik/anggota` (Kelola Anggota): Undang, lihat, dan hapus anggota keluarga.

---

## 4. Pedoman UI/UX & Design System

- **Skema Warna**: Menggunakan tema "Fintech Hangat & Personal" (membangun nuansa keuangan keluarga yang hangat, bukan korporat dingin).
  - Primary: `HSL(258, 90%, 60%)` — Ungu modern (identitas DuitKita).
  - Primary Foreground: `HSL(0, 0%, 100%)`.
  - Secondary: `HSL(258, 90%, 96%)` — Lavender sangat muda untuk background card.
  - Accent Success (Pemasukan): `HSL(151, 65%, 45%)` — Hijau teal.
  - Accent Danger (Pengeluaran): `HSL(0, 84%, 60%)` — Merah rose.
  - Accent Warning (Goal): `HSL(38, 92%, 55%)` — Amber.
  - Background Light: `HSL(0, 0%, 100%)`.
  - Background Dark: `HSL(258, 20%, 12%)` (dukung dark mode).
  - Muted: `HSL(240, 5%, 96%)`.
  - Border: `HSL(240, 6%, 90%)`.
  - Text Primary: `HSL(240, 10%, 12%)`.
- **Tipografi**:
  - Heading: **Plus Jakarta Sans** (bold/semibold) — modern, berkarakter, ramah.
  - Body: **Inter** — sangat readable di angka & tabel.
  - Angka/saldo: **Inter** dengan `font-variant-numeric: tabular-nums` agar rapi saat angka berjajar.
- **Aturan Komponen**:
  - Radius: `rounded-2xl` untuk card utama, `rounded-xl` untuk input/button, `rounded-full` untuk chip kategori.
  - Shadow: `shadow-sm` untuk card default, `shadow-md` saat hover, `shadow-lg` untuk modal/dialog.
  - Jarak: paddding card `p-6`, gap grid `gap-4` (mobile) / `gap-6` (desktop).
  - Tombol Primary: gradient ungu `from-purple-600 to-indigo-500` dengan subtle hover scale 1.02.
  - Saldo: warna hijau teal untuk pemasukan (`+Rp`), merah rose untuk pengeluaran (`-Rp`).
  - Semua badge/kategori pakai warna custom dari field `color` tabel kategori.
- **Nuansa & Vibe**: Hangat, personal, playful tapi tetap serius untuk data keuangan. Banyak whitespace, micro-animations halus (Framer Motion), ilustrasi card-based. Dark mode penuh didukung. Mobile-first (banyak dipakai sambil belanja).

---

## 5. Pembagian Hak Akses Pengguna

| Menu / Halaman                            | Pengunjung (Tanpa Login) | Member (Anggota Keluarga) | Owner (Pembuat Workspace) |
| :---------------------------------------- | :----------------------: | :-----------------------: | :-----------------------: |
| Landing, Tentang, Fitur, Kontak           |            ✅            |            ✅             |            ✅             |
| Login / Register                          |            ✅            |  ❌ (redirect dashboard)  |  ❌ (redirect dashboard)  |
| Join via Undangan `/undang/:code`         |            ✅            |            ✅             |            ✅             |
| Dashboard, Transaksi, Kategori, Dompet    |            ❌            |            ✅             |            ✅             |
| Upload Struk & OCR                        |            ❌            |            ✅             |            ✅             |
| Saving Goals (create/edit/hapus goal)     |            ❌            |            ✅             |            ✅             |
| Laporan & Export PDF/Excel                |            ❌            |            ✅             |            ✅             |
| Audit Log (lihat aktivitas keluarga)      |            ❌            |            ✅             |            ✅             |
| Pengaturan Keluarga (nama, kode undangan) |            ❌            |            ❌             |            ✅             |
| Kelola Anggota (`/pemilik/anggota`)         |            ❌            |            ❌             |            ✅             |
| Profil Pengguna (data sendiri)            |            ❌            |            ✅             |            ✅             |
| Ganti Role / Hapus Keluarga               |            ❌            |            ❌             |            ✅             |

---

## 6. Alur Kerja dan Fitur Utama

_Menjelaskan cara kerja setiap fitur utama dalam bahasa yang mudah dipahami serta aturan logikanya._

### A. Registrasi, Login, & Family Workspace

1. **Cara Kerja**: Pengguna baru mendaftar dengan nama, email, dan password. Setelah verifikasi email, mereka diarahkan ke `/pengaturan-awal` untuk memilih **"Buat Keluarga Baru"** atau **"Gabung via Kode Undangan"**. Jika membuat baru, sistem otomatis membuat workspace keluarga + dompet bersama default + kategori default (Makan, Transport, Belanja, Tagihan, Gaji, dll). Pengguna pertama berperan sebagai **Owner**. Pasangan diminta memasukkan kode undangan 8 karakter (misal `DUIT-XY7A`) untuk bergabung sebagai **Member**. Semua data (transaksi, dompet, goal) dikaitkan dengan `family_id`, sehingga keluarga lain tidak bisa melihat atau menyentuh data ini.
2. **Aturan Sistem**:
   - Email harus unik dan format valid; password minimal 8 karakter kombinasi huruf & angka.
   - Satu user hanya boleh tergabung dalam satu keluarga pada MVP.
   - Kode undangan berlaku 7 hari dan bisa di-regenerate Owner.
   - Isolasi data wajib dijaga di level Row Level Security (RLS) database.

### B. Pencatatan Transaksi (Manual)

1. **Cara Kerja**: Dari `/transaksi/baru`, pengguna memilih tipe (**Pemasukan / Pengeluaran / Transfer**), memilih dompet, kategori, jumlah, dan tanggal. Catatan hanya untuk pemasukan/pengeluaran; struk dan OCR hanya untuk pengeluaran. Transfer hanya memerlukan nominal, dompet sumber/tujuan, dan tanggal, dengan deskripsi otomatis “Transfer antar dompet”. Setelah disimpan, saldo dompet otomatis bertambah/berkurang, dan transaksi langsung muncul di dashboard pasangan (real-time via Supabase realtime).
2. **Aturan Sistem**:
   - Jumlah harus angka positif > 0, maksimal 15 digit.
   - Transaksi transfer wajib punya dompet sumber dan dompet tujuan, dan keduanya berbeda.
   - Transfer/pengeluaran tidak boleh melebihi saldo tersedia. Ubah/hapus transaksi ditolak jika mengurangi saldo dompet terdampak menjadi negatif. Validasi UI didukung trigger database dengan kunci transaksi keluarga. Saldo minus lama boleh dikoreksi, tetapi tidak boleh diperburuk.
   - Jika kategori dihapus tapi masih dipakai transaksi, kategori fallback ke "Lainnya".
   - Setiap create/update/delete wajib mencatat entri di `audit_logs`.

### C. Upload Struk Opsional dengan OCR Otomatis

1. **Cara Kerja**: Pada form pengeluaran, pengguna dapat mengunggah foto struk (JPG/PNG, max 5MB). Sistem meng-upload ke Supabase Storage, lalu menjalankan Tesseract.js di browser untuk ekstraksi teks. Hasil parsing (nominal `total`, `merchant`, `date`) ditampilkan sebagai saran; pengguna memilih **Gunakan Saran** untuk mengisi form, lalu meninjau/memperbaiki sebelum menyimpan. Worker, WASM, dan model bahasa Indonesia/Inggris disajikan dari aplikasi sendiri tanpa API key OCR. Struk disimpan sebagai bukti pada transaksi.
2. **Aturan Sistem**:
   - Upload struk **sepenuhnya opsional** — form tetap bisa disimpan tanpa struk.
   - Ekstraksi berjalan async dengan progres "Membaca struk…" dan dapat dihentikan. Target < 8 detik dan akurasi 85% tetap perlu diukur pada perangkat dan struk nyata; pemuatan model pertama dapat lebih lama. Batas tunggu 60 detik menjaga isian manual tetap tersedia.
   - Jika OCR gagal, form tetap bisa disimpan manual, tapi struk tetap tersimpan sebagai lampiran.
   - Ukuran gambar di-resize otomatis di client sebelum upload (max 1600px lebar).
   - Nama file di Storage: `{family_id}/{userId}/{timestamp}-{random}.jpg` untuk isolasi per keluarga.

### C.1. Nominal, Urutan, dan Budget Kategori (Revisi Fase 2 — 3 Oktober 2026)

- Input nominal transaksi, target, dan budget memakai pemisah ribuan titik serta desimal koma. Nilai yang disimpan tetap angka desimal.
- Daftar transaksi diurutkan tanggal transaksi DESC, lalu waktu pencatatan DESC, dan ID sebagai penentu urutan yang konsisten.
- Budget disimpan sebagai `categories.monthly_budget`, opsional, positif, hanya untuk kategori pengeluaran dan mengikuti isolasi keluarga kategori.
- Batas berulang setiap bulan; pemakaian adalah total pengeluaran kategori pada bulan tanggal transaksi. Transfer dan pemasukan tidak memakai budget. CRUD transaksi langsung memperbarui progres.
- Halaman Kategori menampilkan pemakaian, persentase, sisa/kelebihan, serta pemilih bulan. Peringatan mulai 80%, batas tercapai pada 100%; tetap boleh mencatat pengeluaran selama saldo cukup.
- Editor pengeluaran menampilkan perkiraan setelah simpan, tanpa menghitung transaksi yang sedang diedit dua kali.
- Budget dapat dikosongkan untuk menonaktifkan. Perubahan batas berlaku pada semua bulan tampilan; versi batas historis, rollover, dan pemindahan saldo otomatis tidak disediakan.

### D. Manajemen Dompet Bersama

1. **Cara Kerja**: Setiap keluarga otomatis memiliki **Dompet Keluarga** sebagai pilihan awal transaksi seluruh pengguna. Owner dan member dapat menambah dompet bersama seperti Dompet Liburan, Dana Darurat, dan Dompet Kendaraan. Semua saldo, transaksi, dan riwayat terlihat oleh anggota keluarga yang sama.
2. **Aturan Sistem**:
   - Semua dompet bertipe `shared`, tanpa pemilik pribadi. Isolasi `family_id` tetap wajib.
   - Tepat satu dompet utama per keluarga ditandai `is_primary`; tidak dapat dihapus atau diganti melalui CRUD.
   - Saldo dihitung dari pemasukan, pengeluaran, dan transfer. Transfer antar dompet tidak mengubah total dana keluarga dan tidak masuk pemasukan/pengeluaran laporan.
   - Dompet dengan transaksi atau hubungan target (termasuk arsip) tidak dapat dihapus.

### E. Target Tabungan Terhubung Dompet

1. **Cara Kerja**: Membuat target wajib memilih dompet keluarga yang akan dihubungkan. Contoh: Liburan ke Bali ↔ Dompet Liburan, Membeli Mobil ↔ Dompet Kendaraan. Menabung dilakukan dengan transfer dari Dompet Keluarga ke dompet tujuan melalui form transaksi biasa. Tidak ada pencatatan kontribusi per anggota.
2. **Aturan Sistem**:
   - Satu target terhubung tepat satu dompet; pembuatan atau pemindahan target hanya boleh memakai dompet yang belum dipakai target lain, termasuk arsip lama. Pemeriksaan berlaku di UI dan database dengan penguncian per keluarga.
   - Saldo yang sudah ada langsung menjadi progres target. `current_amount` selalu mengikuti saldo dompet; persentase = saldo / target × 100. Pengeluaran, transfer keluar, perubahan dan penghapusan transaksi memperbarui progres.
   - Status otomatis `achieved` ketika saldo mencapai target; kembali `active` jika saldo turun di bawah target. Status `archived` hanya dipertahankan untuk riwayat lama di database.
   - Fitur dan tab arsip dihapus. Arsip lama beserta duplikat tautan historis dipertahankan tanpa perubahan saldo; tidak ditampilkan sebagai target berjalan dan dompetnya tidak dapat dipakai membuat target baru. Target berjalan yang sudah berbagi dompet dengan arsip lama tetap dapat diedit pada dompet asalnya.
   - Detail target menampilkan riwayat transaksi dompet, tanpa pembagian kontribusi per pengguna. Pencatat transaksi tetap tersedia untuk audit.
   - Migrasi lama: dompet pribadi menjadi bersama; setiap target lama mendapat dompet khusus, kontribusi dipindahkan ke ledger transaksi sebagai transfer. Catatan kontribusi lama disimpan hanya sebagai arsip baca dan tidak ikut perhitungan saldo.

### F. Audit Log Aktivitas

1. **Cara Kerja**: Setiap aksi mutasi data (create/update/delete) pada entitas `transactions`, `wallets`, `categories`, `saving_goals`, `family_members` akan dicatat ke `audit_logs` dengan detail lengkap: siapa, kapan, entitas apa, aksi apa, nilai sebelum & sesudah.
2. **Aturan Sistem**:
   - Log **tidak bisa dihapus** oleh member biasa (hanya Owner yang bisa purge > 1 tahun).
   - Log hanya bisa dilihat oleh anggota keluarga yang sama (`family_id` matching).
   - Menyimpan `user_agent` dan `ip_address` untuk forensik.

### G. Rekapan & Laporan (Harian/Mingguan/Bulanan/Kategori/Anggota)

1. **Cara Kerja**: Di `/laporan`, pengguna memilih:
   - **Periode**: Harian, Mingguan, Bulanan, atau kustom rentang tanggal.
   - **Grouping**: per Kategori, per Anggota, per Dompet.
   - Sistem menampilkan tabel + grafik (pie chart komposisi, bar chart tren).
   - Tombol **"Export PDF"** dan **"Export Excel"** menghasilkan file dengan header berisi nama keluarga, periode, dan total ringkasan.
2. **Aturan Sistem**:
   - Export PDF menggunakan `jspdf` (client-side) atau server PDF streaming.
   - Export Excel menggunakan `xlsx` (SheetJS).
   - Rentang tanggal maksimal 1 tahun per export.
   - Format angka: `Rp 1.250.000,00` (id-ID locale).

---

## 7. Alur Navigasi & Arsitektur Layout

_Peta navigasi alur halaman dan struktur tata letak (layout)._

### Arsitektur Layout (Persisten)

- **Public Layout**: Header transparan dengan logo DuitKita, menu (Fitur, Tentang, Kontak), CTA "Masuk" & "Daftar". Footer dengan link sosial & legal.
- **App Layout (Setelah Login)**: Sidebar kiri fixed (Dashboard, Transaksi, Dompet, Kategori, Saving Goals, Laporan, Audit Log, Pengaturan) + Header atas dengan avatar pengguna, notifikasi, dan tombol "Catat Transaksi" cepat.
- **Mobile**: Sidebar berubah menjadi bottom navigation untuk 5 menu utama + drawer untuk menu lainnya.

### Bagan Alur (Flowchart)

```mermaid
flowchart TD
    A[Pengunjung] --> B[Landing Page]
    B --> C{Sudah Punya Akun?}
    C -- Belum --> D[Register Email/Password]
    C -- Sudah --> E[Login]
    D --> F[Verifikasi Email]
    F --> G[Onboarding]
    E --> G
    G --> H{Pilih Aksi}
    H -- Buat Keluarga Baru --> I[Buat Workspace + Dompet Bersama + Kategori Default]
    H -- Join via Kode --> J[Gabung Keluarga via /undang/code]
    I --> K[Dashboard]
    J --> K
    K --> L{Pilih Menu}
    L --> M[Catat Transaksi Manual]
    L --> N[Catat + Upload Struk OCR]
    L --> O[Kelola Saving Goals]
    L --> P[Lihat Laporan & Export]
    L --> Q[Lihat Audit Log]
    N --> R[Upload ke Supabase Storage]
    R --> S[Tesseract.js di Browser]
    S --> T[Periksa Saran dan Isi Form]
    T --> U[Simpan Transaksi]
    M --> U
    U --> V[Update Saldo & Realtime Push ke Pasangan]
    V --> W[Log ke Audit Trail]
    O --> X[Transfer ke Dompet Target & Update Progress]
    P --> Y[Export PDF / Excel]
```

---

## 8. Kebutuhan Non-Fungsional (SEO, Keamanan, & Performa)

_Syarat wajib agar website siap rilis ke publik (production-ready)._

- **SEO**:
  - Meta title dinamis dengan template `{Page} — DuitKita` via Next.js `generateMetadata`.
  - Meta description, canonical URL, dan Open Graph image (`/og.png`) di setiap halaman publik.
  - `sitemap.xml` & `robots.txt` untuk landing/tentang/fitur/kontak (halaman dalam app di-noindex).
  - Schema.org JSON-LD `SoftwareApplication` di landing page.
- **Keamanan**:
  - Autentikasi via **Supabase Auth** dengan JWT httpOnly cookie.
  - **Row Level Security (RLS)** aktif di semua tabel Postgres — setiap query filter wajib `family_id = auth.jwt()->>'family_id'`.
  - CSRF protection bawaan Next.js Server Actions + sameSite cookie.
  - Sanitasi input dengan **Zod** di setiap Server Action.
  - Rate limiting di endpoint masuk/daftar & OCR (Upstash Ratelimit atau Vercel Edge Config).
  - Upload file: validasi MIME type (`image/jpeg`, `image/png`), max 5MB, scan basic headers.
  - Audit log tidak bisa dihapus member biasa (RLS policy).
- **Performa**:
  - Server Components default; Client Components hanya untuk form interaktif, chart, & filter.
  - Optimasi gambar via `next/image` dengan `unoptimized: false`.
  - Realtime subscription Supabase untuk transaksi baru (channel per `family_id`).
  - Caching via `unstable_cache` untuk kategori default & metadata keluarga.
  - Cold start Vercel Edge Function < 2 detik; deploy region Singapore (`sin1`).
  - Instant loading skeleton di semua route segment.

---

## 9. Panduan Bahasa, Copywriting, & Data Dummy

_Panduan nada bicara (Tone of Voice) dan contoh data agar prototipe terasa nyata._

- **Gaya Bahasa**: Hangat, personal, dan membumi (menggunakan "Anda" untuk pengguna, "DuitKita" untuk aplikasi, hindari jargon teknis). CTA seperti "Catat dulu, biar tenang", "Uang berdua, tercatat berdua".
- **Instruksi Data Dummy**: JANGAN PERNAH MENGGUNAKAN "Lorem Ipsum". Selalu gunakan data dummy berbahasa Indonesia yang kontekstual.
  - **Nama Keluarga**: "Keluarga Budi & Sari"
  - **Nama Pengguna**: "Budi Santoso" (owner), "Sari Wulandari" (member)
  - **Dompet**: "Dompet Keluarga" (utama), "Dompet Liburan", "Dana Darurat", "Dompet Kendaraan" (semuanya shared)
  - **Kategori**: Makan & Minum, Transportasi, Belanja Bulanan, Tagihan & Utilitas, Kesehatan, Hiburan, Gaji, Bonus, Freelance, Pendidikan Anak, Zakat & Donasi.
  - **Contoh Transaksi**:
    - 2024-06-03, "- Rp 87.500", kategori "Makan & Minum", dompet "Dompet Keluarga", catatan "Makan malam di Sate Padang Ajo, struk terlampir".
    - 2024-06-05, "+ Rp 8.500.000", kategori "Gaji", dompet "Dompet Keluarga", catatan "Gaji bulan Juni".
    - 2024-06-07, "- Rp 245.000", kategori "Belanja Bulanan", dompet "Dompet Keluarga", catatan "Belanja di Indomaret & Sayur Mayur".
  - **Saving Goals**:
    - "DP Rumah Impian" — target Rp 150.000.000 — progress Rp 42.500.000 (28%).
    - "Liburan ke Bali 2027" — target Rp 15.000.000 — progress Rp 9.750.000 (65%).
    - "Dana Pendidikan Anak" — target Rp 50.000.000 — progress Rp 12.000.000 (24%).
  - **Audit Log Filtered**: "Budi Santoso mengubah transaksi #TRX-2024-0031 (Rp 500.000 → Rp 487.500)", "Sari Wulandari mentransfer Rp 2.000.000 ke Dompet Rumah Impian".

---

## 10. Fondasi Teknis (Untuk Tim Pengembang / Programmer & AI)

_Petunjuk arsitektur teknis spesifik._

- **Bahasa & Framework**: **Next.js 15 (App Router)** + **TypeScript** — optimal untuk Vercel serverless.
- **Tampilan Antarmuka (UI)**: **Tailwind CSS v4**, **shadcn/ui**, **Lucide Icons**, **Recharts** (chart), **Framer Motion** (animasi).
- **Autentikasi**: **Supabase Auth** (Email & Password, dengan opsi email confirmation).
- **Basis Data (Database)**: **Supabase PostgreSQL** + **Drizzle ORM** (untuk type-safety) + **Supabase Storage** (bukti struk).
- **OCR Struk**: **Tesseract.js** (Web Worker + WASM, bahasa `ind` dan `eng`) dengan parser struk Indonesia untuk saran nominal, tanggal, merchant. Dipilih pengguna menggantikan OpenAI; tanpa biaya API OCR, sementara biaya hosting/Storage mengikuti paket layanan.
- **Export**: `jspdf` + `jspdf-autotable` (PDF), `xlsx` (Excel).
- **Validasi**: **Zod** untuk schema validasi server & client.
- **Realtime**: **Supabase Realtime** channel per `family_id`.
- **Deployment**: **Vercel** region `sin1`.

### Struktur Skema Database Nyata

_Skema di bawah menggunakan Drizzle ORM (TypeScript) yang di-generate ke Supabase PostgreSQL. RLS policy ditambahkan via migration SQL._

```typescript
// src/db/schema.ts
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  decimal,
  boolean,
  date,
  jsonb,
  index,
  pgEnum,
  uniqueIndex,
  unique,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["owner", "member"]);
export const walletTypeEnum = pgEnum("wallet_type", ["shared", "personal"]);
export const txTypeEnum = pgEnum("tx_type", ["income", "expense", "transfer"]);
export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "achieved",
  "archived",
]);
export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
]);

// === FAMILIES (workspace) ===
export const families = pgTable("families", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  inviteCode: varchar("invite_code", { length: 12 }).notNull().unique(),
  inviteExpiresAt: timestamp("invite_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// === USERS (profile, 1-1 dengan auth.users) ===
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(), // reference auth.users.id Supabase
    familyId: uuid("family_id").references(() => families.id, {
      onDelete: "cascade",
    }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull(),
    avatarUrl: text("avatar_url"),
    role: roleEnum("role").default("member").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({ familyIdx: index("user_family_idx").on(t.familyId) }),
);

// === WALLETS (semua dompet milik keluarga) ===
export const wallets = pgTable(
  "wallets",
  {
    isPrimary: boolean("is_primary").default(false).notNull(),
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    ownerUserId: uuid("owner_user_id").references(() => users.id, {
      onDelete: "cascade",
    }), // null = shared
    name: varchar("name", { length: 120 }).notNull(),
    type: walletTypeEnum("type").notNull().default("shared"),
    currency: varchar("currency", { length: 3 }).default("IDR").notNull(),
    icon: varchar("icon", { length: 50 }).default("wallet"),
    color: varchar("color", { length: 20 }).default("#7c3aed"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("wallet_primary_family_idx")
      .on(t.familyId)
      .where(sql`${t.isPrimary}`),
    unique("wallet_id_family_unique").on(t.id, t.familyId),
    check(
      "shared_wallet_only",
      sql`${t.type}='shared' and ${t.ownerUserId} is null`,
    ),
  ],
);

// === CATEGORIES ===
export const categories = pgTable("categories", {
  monthlyBudget: decimal("monthly_budget", { precision: 15, scale: 2 }), // null = tanpa batas; positif dan hanya expense
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: txTypeEnum("type").notNull(),
  icon: varchar("icon", { length: 50 }).default("tag"),
  color: varchar("color", { length: 20 }).default("#7c3aed"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// === TRANSACTIONS ===
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    toWalletId: uuid("to_wallet_id").references(() => wallets.id), // untuk transfer
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    type: txTypeEnum("type").notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    description: text("description"),
    transactionDate: date("transaction_date").notNull(),
    receiptUrl: text("receipt_url"),
    receiptOcrData: jsonb("receipt_ocr_data"), // { merchant, total, date, raw }
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    familyDateIdx: index("tx_family_date_idx").on(
      t.familyId,
      t.transactionDate,
    ),
    walletIdx: index("tx_wallet_idx").on(t.walletId),
  }),
);

// === SAVING GOALS ===
export const savingGoals = pgTable(
  "saving_goals",
  {
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    name: varchar("name", { length: 150 }).notNull(),
    targetAmount: decimal("target_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    currentAmount: decimal("current_amount", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    deadline: date("deadline"),
    icon: varchar("icon", { length: 50 }).default("target"),
    color: varchar("color", { length: 20 }).default("#f59e0b"),
    status: goalStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("goal_wallet_open_idx")
      .on(t.familyId, t.walletId)
      .where(sql`${t.status}<>'archived'`),
    foreignKey({
      name: "goal_wallet_family_fk",
      columns: [t.walletId, t.familyId],
      foreignColumns: [wallets.id, wallets.familyId],
    }).onDelete("restrict"),
  ],
);

// === SAVING CONTRIBUTIONS (arsip sebelum migrasi dompet; hanya baca) ===
export const savingContributions = pgTable("saving_contributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => savingGoals.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  walletId: uuid("wallet_id").references(() => wallets.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  note: text("note"),
  contributedAt: timestamp("contributed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// === AUDIT LOGS ===
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: auditActionEnum("action").notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(), // transactions, wallets, goals...
    entityId: uuid("entity_id"),
    beforeData: jsonb("before_data"),
    afterData: jsonb("after_data"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({ familyIdx: index("audit_family_idx").on(t.familyId, t.createdAt) }),
);

// === RELATIONS ===
export const familiesRelations = relations(families, ({ many }) => ({
  users: many(users),
  wallets: many(wallets),
  categories: many(categories),
  transactions: many(transactions),
  goals: many(savingGoals),
  logs: many(auditLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  family: one(families, {
    fields: [users.familyId],
    references: [families.id],
  }),
  transactions: many(transactions),
  contributions: many(savingContributions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  family: one(families, {
    fields: [transactions.familyId],
    references: [families.id],
  }),
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const savingGoalsRelations = relations(savingGoals, ({ one, many }) => ({
  family: one(families, {
    fields: [savingGoals.familyId],
    references: [families.id],
  }),
  contributions: many(savingContributions),
}));
```

### SQL Migration untuk RLS Policy (Contoh)

```sql
-- Aktifkan RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: hanya user dengan family_id sama yang bisa select
CREATE POLICY "family_isolation_select" ON transactions
  FOR SELECT USING (family_id::text = (auth.jwt() ->> 'family_id'));

-- Policy: hanya user dengan family_id sama yang bisa insert
CREATE POLICY "family_isolation_insert" ON transactions
  FOR INSERT WITH CHECK (family_id::text = (auth.jwt() ->> 'family_id'));

-- Terapkan pola yang sama untuk wallets, categories, saving_goals, audit_logs
```

### Variabel Lingkungan (`.env.example`)

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DuitKita

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... # HANYA server side

# Database (Drizzle connection - direct Postgres)
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# OCR Tesseract.js berjalan di browser; tidak memerlukan API key.

# Storage
NEXT_PUBLIC_SUPABASE_RECEIPT_BUCKET=receipts

# Rate limiting (opsional)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxx

# Auth
AUTH_COOKIE_SECRET=random-32-char-secret
```

---

## 11. Tahapan Pengerjaan & Task Breakdown (Actionable Work Breakdown Structure)

_Daftar tugas terstruktur dan terurut (Atomic Tasks). Dirancang khusus agar pengguna dapat menginstruksikan AI Coding Assistant untuk mengeksekusi proyek langkah demi langkah per Fase/Milestone secara terukur, modular, dan bebas dari kehabisan context window._

### Tahap 1: Fondasi Proyek, UI/UX, & Semua Halaman (Dummy Data)

_Tujuan: Membangun seluruh antarmuka visual secara 100% lengkap dan responsif menggunakan data dummy sebelum menyentuh database._

- [x] **Task 1.1 (Foundations & Design System)**: Setup Next.js 15 + TypeScript + Tailwind CSS v4 + shadcn/ui. Konfigurasi token warna (Primary ungu HSL 258, accent success/danger) di `globals.css`, font Plus Jakarta Sans + Inter via `next/font`, install semua komponen (Button, Card, Input, Dialog, Table, Badge, Dropdown, Tabs, Progress, Sheet, Toast) dan library pendukung (lucide-react, recharts, framer-motion).
- [x] **Task 1.2 (Layouts & Persistent Navigation)**: Buat `app/(public)/layout.tsx` dengan Public Header + Footer, dan `app/(app)/layout.tsx` dengan Sidebar persisten + Header atas + bottom-navigation mobile. Buat komponen `<CurrencyDisplay />` untuk format `Rp 1.250.000` (id-ID) dan `<CategoryBadge />`.
- [x] **Task 1.3 (Public Pages — Dummy)**: Buat landing `/`, `/tentang`, `/fitur`, `/kontak`, `/masuk`, `/daftar`, `/undang/[code]` lengkap dengan hero, ilustrasi, fitur grid, testimoni (dummy: "Keluarga Budi & Sari"), FAQ accordion, dan form auth (belum connect Supabase).
- [x] **Task 1.4 (Dashboard & Transaksi Pages — Dummy)**: Buat `/dashboard` (saldo gabungan, saldo per dompet, chart tren 7 hari, komposisi kategori), `/transaksi` (tabel dengan filter tanggal/kategori/anggota/dompet + search), `/transaksi/baru` (form lengkap dengan tab Income/Expense/Transfer + area drag-and-drop upload struk + placeholder hasil OCR), `/transaksi/[identitas]` (detail + preview struk).
- [x] **Task 1.5 (Wallet, Kategori, Saving Goals — Dummy)**: Buat `/dompet` (grid card dompet bersama + modal CRUD), `/kategori` (list + modal CRUD), `/tabungan` (card dengan progress bar + saldo dompet terhubung), `/tabungan/[identitas]` (detail + riwayat transaksi dompet).
- [x] **Task 1.6 (Laporan, Audit Log, Pengaturan — Dummy)**: Buat `/laporan` (filter Harian/Mingguan/Bulanan + rentang tanggal kustom + tab per Kategori/Anggota + tombol Export PDF/Excel [belum berfungsi]), `/riwayat-aktivitas` (tabel log dengan badge aksi create/update/delete), `/pengaturan` (info keluarga + kode undangan + kelola anggota), `/profil` (edit profil + ganti password), `/pemilik/dashboard` + `/pemilik/anggota`.

### Tahap 2: Database, Autentikasi, & Integrasi Data Dinamis

_Tujuan: Menghidupkan aplikasi dengan database nyata, sistem autentikasi pengguna, dan API/Server Actions._

- [x] **Task 2.1 (Database Schema & Migrations)**: Setup Supabase project + Storage bucket `receipts`. Buat file `src/db/schema.ts` sesuai skema Bab 10, jalankan `drizzle-kit generate` + `drizzle-kit migrate`, buat SQL RLS policies untuk tabel `transactions`, `wallets`, `categories`, `saving_goals`, `audit_logs`, `users` (isolasi `family_id`), lalu buat seed script data awal (default categories + dompet bersama default saat family dibuat).
- [ ] **Task 2.2 (Authentication & Route Middleware)**: Setup Supabase Auth Email & Password. Buat `middleware.ts` untuk: (a) redirect user login dari `/masuk`,`/daftar` ke `/dashboard`, (b) proteksi semua rute `/dashboard`, `/transaksi`, `/dompet`, `/kategori`, `/tabungan`, `/laporan`, `/riwayat-aktivitas`, `/pengaturan`, `/profil`, `/pemilik/*`, (c) inject `family_id` ke JWT claims agar RLS jalan. Buat Server Action `register`, `login`, `logout`, `createFamily`, `joinFamily`, `onboarding`.
- [ ] **Task 2.3 (Server Actions CRUD)**: Buat Server Actions dengan validasi Zod untuk: `createTransaction`, `updateTransaction`, `deleteTransaction` (dengan saldo hanya direkalkulasi sebagai agregat), `createWallet/updateWallet/deleteWallet`, `createCategory/updateCategory/deleteCategory`, `createGoal/updateGoal/deleteGoal` dengan `walletId` wajib; tabungan memakai transfer transaksi. Semua action wajib menulis ke `audit_logs`. Buat query helper `getTransactionsByFamily(filter)`, `getWalletBalances(familyId)`, `getSavingGoals(familyId)`, `getAuditLogs(familyId)`.
- [ ] **Task 2.4 (OCR & Storage Integration)**: Buat Server Action `uploadReceipt(file)` dan alur: (1) resize client-side, (2) upload ke Supabase Storage privat, (3) baca foto dengan Tesseract.js di browser, (4) parse `{merchant, total, date}` dan tampilkan saran untuk diterapkan pengguna. Pertahankan API route `/api/ocr/pratinjau` untuk status unggah; progres OCR berasal dari worker lokal. Bila gagal/dibatalkan, lampiran tetap tersedia dan isian manual dapat digunakan.
- [ ] **Task 2.5 (Frontend Data Binding & Realtime)**: Ganti seluruh data dummy di Task 1.3–1.6 dengan data dari Server Actions. Pasang Supabase Realtime subscription pada tabel `transactions` filter `family_id=eq.{currentFamilyId}` untuk push transaksi baru ke pasangan secara real-time. Implement optimistic UI pada form transaksi (instant feedback).

### Tahap 3: Laporan, Export, Keamanan, SEO, & Deployment

_Tujuan: Menyempurnakan fitur laporan, ekspor data, keamanan, SEO, dan rilis produksi ke Vercel._

- [x] **Task 3.1 (Laporan & Export PDF/Excel)**: Implementasi query agregasi di `/laporan` untuk: (a) rekap harian/mingguan/bulanan, (b) rekap per kategori, (c) rekap per anggota, (d) filter rentang tanggal kustom. Integrasikan `jspdf` + `jspdf-autotable` untuk export PDF (header: nama keluarga + periode + grafik ringkas) dan `xlsx` untuk export Excel multi-sheet (Sheet1: Transaksi, Sheet2: Summary Kategori, Sheet3: Summary Anggota).
- [ ] **Task 3.2 (Non-Functional: SEO, Security, Performance)**: Setup `generateMetadata` di semua halaman publik, OG image dinamis, `sitemap.xml`, `robots.txt`, JSON-LD `SoftwareApplication`. Terapkan rate-limiting pada `/masuk`, `/daftar`, dan `/api/ocr/pratinjau` via Upstash. Validasi ulang semua input dengan Zod di layer server. Aktifkan Supabase database indexes (`tx_family_date_idx`, `audit_family_idx`). Optimasi `next/image`, `React Suspense` + loading skeleton di setiap route segment.
- [ ] **Task 3.3 (End-to-End Testing & Bugfix)**: Uji seluruh user journey: (1) register → onboarding → create family, (2) login pasangan → join via kode undangan, (3) catat transaksi manual, (4) catat transaksi dengan upload struk OCR, (5) buat target terhubung dompet + transfer tabungan, (6) export PDF & Excel, (7) cek audit log terekam, (8) pastikan isolasi data antar keluarga (test dengan 2 akun berbeda keluarga). Fix responsive glitches, animasi, dan query performance.
- [ ] **Task 3.4 (Production Build & Deployment)**: Setup environment production di Vercel (integrate dengan GitHub), set semua env dari `.env.example` di Vercel Dashboard, konfigurasi region `sin1`, pastikan `pnpm build` lulus tanpa error, aktifkan Vercel Analytics & Speed Insights, hubungkan custom domain bila ada, publish.

---

## 12. Master Starter Prompt (Siap Coding untuk AI Agent)

_Salin prompt di bawah ini ke AI Coding Assistant (Google Antigravity / Cursor / Claude Code / GitHub Copilot / Roo Code / dll.) untuk memulai pengerjaan:_

```markdown
Halo! Kamu berperan sebagai Senior Fullstack Architect dan Lead Developer.
Saya ingin membangun aplikasi bernama DuitKita berdasarkan dokumen PRD ini.

Silakan baca file @PRD.md secara menyeluruh terlebih dahulu.

ATURAN EKSEKUSI (WAJIB DIPATUHI — MODE: PHASE/MILESTONE):

1. JANGAN PERNAH membuat semua kode atau file sekaligus dalam satu waktu agar tidak terjadi error atau kehabisan context window.
2. Pahami dokumen PRD secara menyeluruh, lalu tanyakan kepada saya untuk mulai mengeksekusi Bab 11 mulai dari FASE 1.
3. Selesaikan SATU FASE secara tuntas (semua Task di dalamnya, misal Fase 1 = Task 1.1 sampai 1.6 lengkap) dalam satu putaran kerja.
4. Setelah satu Fase selesai, kamu WAJIB BERHENTI, laporkan apa yang telah dikerjakan (file apa saja, halaman apa saja, screenshot/preview bila memungkinkan), lalu minta konfirmasi dari saya sebelum lanjut ke Fase berikutnya.
5. JANGAN melompat ke Fase 2 sebelum saya beri izin eksplisit.
6. Selalu patuhi Tech Stack (Next.js 15 + Supabase + Drizzle ORM + Tailwind + shadcn/ui), skema database di Bab 10, dan Pedoman UI/UX Design System di Bab 4 dari PRD.
7. Wajib jaga prinsip multi-tenant: SEMUA query harus ter-filter `family_id`, dan isolasi antar keluarga tidak boleh bocor.
8. Gunakan bahasa Indonesia untuk semua copywriting UI sesuai panduan Bab 9, dan SELALU gunakan data dummy realistis (keluarga "Budi & Sari") — DILARANG menggunakan "Lorem Ipsum" atau halaman placeholder "Dalam pengembangan".

Jika kamu sudah membaca dan memahami PRD, silakan berikan ringkasan singkat pemahamanmu, konfirmasi tech stack & struktur folder yang akan kamu buat, lalu tanyakan kesiapan saya untuk mulai dari Fase 1 (Task 1.1)!
```

