# Laporan Fase 1 — DuitKita

Implementasi Task **1.1–1.6** selesai. Nama aplikasi diseragamkan menjadi **DuitKita**, termasuk referensi nama dalam PRD. Fase 2 belum dimulai.

Penyesuaian setelah Fase 1: seluruh folder rute memakai bahasa Indonesia sesuai permintaan pengguna. Pengecualian: `dashboard`, `(app)`, `(public)`, dan `[code]`. Parameter detail menggunakan `[identitas]`. Navigasi, tes, dan referensi rute dalam PRD telah diselaraskan.

Verifikasi setelah penamaan ulang: build produksi berhasil (termasuk lint dan pemeriksaan tipe), seluruh 23 halaman tersedia, dan 11 pengujian kembali lulus dalam 18,7 detik. Rute tabungan sekarang `/tabungan`; akun menggunakan `/masuk`, `/daftar`, `/lupa-kata-sandi`, dan `/pengaturan-awal`; pengelolaan menggunakan `/riwayat-aktivitas`, `/profil`, serta `/pemilik/*`.

## Hasil per task

| Task | Hasil | Lokasi utama |
| --- | --- | --- |
| 1.1 | Next.js 15, TypeScript, Tailwind v4, 18 komponen shadcn/ui, font, warna, tema gelap, ikon, grafik, animasi | `package.json`, `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/` |
| 1.2 | Layout publik dan aplikasi persisten, sidebar, header, drawer, navigasi bawah, format rupiah, badge kategori | `src/components/layouts/`, `src/components/shared/common.tsx` |
| 1.3 | Landing, fitur, tentang, kontak, masuk, daftar, undangan; tambahan onboarding dan pemulihan kata sandi | `src/app/(public)/`, `src/features/public/` |
| 1.4 | Dasbor saldo, tren 7 hari, komposisi kategori, daftar/filter transaksi, form dan detail, lampiran struk | `src/features/dashboard/`, `src/features/transactions/`, `public/receipts/` |
| 1.5 | CRUD dompet dan kategori, target tabungan, detail target, kontribusi, progres, arsip | `src/features/wallets/`, `src/features/categories/`, `src/features/goals/` |
| 1.6 | Laporan/filter/pengelompokan, audit log, pengaturan keluarga, profil, dasbor owner dan anggota | `src/features/reports/`, `src/features/audit/`, `src/features/settings/` |

## Halaman yang tersedia

- Publik: `/`, `/tentang`, `/fitur`, `/kontak`.
- Akun demo: `/masuk`, `/daftar`, `/lupa-kata-sandi`, `/pengaturan-awal`, `/undang/[code]`.
- Keuangan: `/dashboard`, `/transaksi`, `/transaksi/baru`, `/transaksi/[identitas]`, `/dompet`, `/kategori`.
- Tabungan: `/tabungan`, `/tabungan/[identitas]`.
- Laporan dan pengelolaan: `/laporan`, `/riwayat-aktivitas`, `/pengaturan`, `/profil`, `/pemilik/dashboard`, `/pemilik/anggota`.
- Tambahan: halaman tidak ditemukan, penanganan galat, loading skeleton, favicon.

## Perilaku yang dapat dicoba

1. Buat, ubah, dan hapus transaksi; lihat saldo berubah dan audit tercatat.
2. Filter transaksi menurut tanggal, kategori, anggota, dompet, jenis, atau pencarian catatan.
3. Lampirkan foto JPG/PNG, lihat preview, atau gunakan contoh hasil OCR Sate Padang Ajo.
4. Tambah/ubah/hapus dompet kosong; dompet dengan riwayat dilindungi dari penghapusan.
5. Tambah/ubah/hapus kategori; transaksi kategori terhapus dipindahkan ke “Lainnya”.
6. Buat dan ubah target, tambah kontribusi, lihat progres dan status tercapai, arsipkan tanpa menghapus riwayat.
7. Pilih laporan harian/mingguan/bulanan/kustom dan pengelompokan kategori/anggota/dompet.
8. Perbarui nama keluarga, buat kode undangan baru, keluarkan/pulihkan anggota demo, ubah profil dan foto.
9. Ganti tampilan sebagai Budi/Sari melalui avatar. Detail dompet pasangan dan halaman pemilik tidak ditampilkan kepada anggota.
10. Ganti tema, gunakan navigasi mobile, dan atur ulang data demo melalui avatar.

## Batas fase

Data hanya tersimpan dalam memori sesi browser. Reload mengembalikan data contoh. Semua data adalah contoh; pembatasan antarmuka belum menjadi keamanan produksi karena seed dikirim ke browser.

Supabase Auth, database, Drizzle, RLS, Storage, OCR nyata, realtime, dan Server Actions menunggu Fase 2. Ekspor PDF/Excel, penguatan keamanan, SEO lengkap, dan deployment mengikuti Fase 3. Tombol ekspor sengaja dinonaktifkan sesuai PRD.

Nominal awal konsisten: saldo keluarga **Rp23.852.500**, Dompet Rumah Tangga **Rp14.352.500**, tabungan tujuan **Rp61.250.000**. Kontribusi tabungan dihitung terpisah dari transaksi belanja, dan dimasukkan sebagai uang keluar pada laporan.

## Preview

- [Landing desktop](screenshots/landing-desktop.png)
- [Dasbor desktop](screenshots/dashboard-desktop.png)
- [Dasbor dark mode](screenshots/dashboard-dark.png)
- [Landing mobile](screenshots/landing-mobile.png)
- [Dasbor mobile](screenshots/dashboard-mobile.png)

## Pemeriksaan

Skenario otomatis berada di `tests/phase-one.spec.ts` dan `tests/demo-isolation.spec.ts`: seluruh rute, transaksi CRUD, transfer, OCR contoh, dompet/kategori, kontribusi, target tercapai dan arsip, pengaturan/profil/anggota, filter laporan, validasi register/struk, peran pengguna, helper keluarga, mobile, dark mode, serta screenshot.

Perintah verifikasi: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test:e2e`.

Hasil akhir: **TypeScript lulus, lint tanpa warning/error, build produksi berhasil, 11 pengujian lulus (22,7 detik) pada build produksi.** Seluruh 23 halaman diperiksa di browser; pemeriksaan mobile memakai viewport 390 × 844. Screenshot desktop, mobile, dan dark mode telah ditinjau.

Daftar seluruh file implementasi: [FILES-FASE-1.md](FILES-FASE-1.md). Petunjuk menjalankan dan catatan arsitektur Fase 2: [README.md](../README.md).

**Berhenti di sini: kelanjutan Fase 2 memerlukan konfirmasi eksplisit pengguna.**
