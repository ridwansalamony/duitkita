# Review keamanan dan kapasitas - 10 Oktober 2026

## Perubahan

- Next.js 15.5.27 dan source-map-js >=1.2.2 memperbaiki advisory yang ditemukan audit dependency.
- Mutasi maksimal 30 request/menit per akun, penyegaran workspace 30/menit, token Realtime 12/menit. Upstash berbagi pembatasan antar instance; production menolak request ketika limiter tidak tersedia. Pembatasan dilakukan setelah verifikasi akun dan sebelum koneksi database diambil.
- Runtime shared Supabase pooler port 5432 diarahkan ke transaction mode 6543. Pool global tetap maksimal dua koneksi per proses, prepared statement dinonaktifkan. DIRECT_URL untuk migrasi tetap terpisah.
- Setiap transaksi aplikasi memakai statement timeout 10 detik, lock timeout 3 detik, idle transaction timeout 15 detik.
- Saldo seluruh dompet dihitung bersama melalui agregasi SQL, termasuk debit/kredit transfer. Saldo keluarga dijumlahkan di PostgreSQL dengan numeric.
- Event audit beruntun digabung 300 ms. Polling ketika Realtime sehat menjadi sekitar 60 detik; ketika terputus sekitar 15 detik. Revision audit menghindari snapshot ulang ketika belum ada perubahan. URL struk tetap diperbarui sebelum masa berlakunya habis.
- Riwayat pada snapshot hanya mengambil informasi yang ditampilkan. Log baru tidak menyalin base64 avatar, OCR, atau kode undangan. Riwayat lama tidak dihapus.
- Migrasi 0006 menambahkan indeks transaksi berdasarkan keluarga/urutan, tujuan transfer, kategori, pencatat, struk, target, dan pengguna audit. CHECK payload berlaku juga untuk jalur database langsung. NOT VALID menjaga kompatibilitas baris lama; data baru tetap diperiksa.
- Laporan maksimum 10.000 transaksi per request; kelebihan ditolak dengan pesan memperpendek rentang, tidak dipotong diam-diam.
- Migrasi 0007 menambahkan counter privat dan batas 60 perubahan baris utama per menit per akun/keluarga di database. Request langsung ke PostgREST juga diperiksa; perubahan turunan dari trigger tidak dihitung ulang. Batch yang melewati batas dibatalkan seluruhnya. Counter hanya bertambah untuk transaksi yang commit, bukan percobaan yang rollback.

## Validasi

`pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm audit --prod`, `pnpm exec tsx scripts/test-database.mts`, tes rate-limit/runtime pooler/workspace, dan tes HTTP/PWA.

`pnpm exec tsx scripts/test-database-pool.mts` menjalankan 30 transaksi identitas paralel pada Supabase melalui dua koneksi. Semua read-only; tes ini memverifikasi pool dan pemisahan JWT, bukan benchmark throughput transaksi keuangan.

`pnpm exec tsx scripts/audit-database.mts` memeriksa RLS, publication audit, indeks, constraint, dan referensi keluarga tanpa menampilkan data pribadi.

Hasil pemeriksaan: 25 tes unit/browser lulus pada build demo, enam tes HTTP/PWA lulus pada build live, tes database lulus, build live/demo berhasil, lint/typecheck lulus, dan audit production dependency melaporkan nol advisory. Workflow GitHub Actions ditambahkan untuk pemeriksaan otomatis pada push/PR; workflow belum dijalankan di GitHub sampai perubahan dipush.

Tes PostgreSQL lokal melalui PGlite mencakup isolasi dua keluarga, JWT keluarga palsu, anggota yang dicabut, saldo nol/kurang, transfer/edit/hapus, batch dua debit yang melebihi saldo dan rollback, target unik, payload besar, audit tanpa avatar, dan kesetaraan saldo agregat. PGlite tidak menguji transaksi tulis dari beberapa koneksi PostgreSQL nyata.

## Batas kapasitas yang masih perlu diukur

Tidak ada jaminan bebas gangguan atau angka pengguna maksimum tanpa pengujian staging dan ukuran paket Supabase/Vercel/Upstash. Rate limit per akun tidak menghentikan serangan dari banyak akun/IP; aktifkan proteksi jaringan/WAF dan pantau CPU, koneksi, latensi, 429/503, serta egress.

Snapshot masih memuat seluruh transaksi keluarga ketika data berubah. Untuk keluarga dengan riwayat sangat panjang, tahap skala berikutnya membutuhkan pagination transaksi dari server serta agregasi dashboard/budget dari server. Jangan membatasi daftar diam-diam karena dapat mengubah saldo dan laporan di UI.

RLS, CHECK, dan limiter database melindungi jalur PostgREST. Percobaan gagal/rollback dan banyak identitas tetap dapat memakai CPU/koneksi; ini membutuhkan proteksi jaringan dan pengujian staging. Pembatasan akun tidak menggantikan proteksi terhadap serangan terdistribusi.

Advisory Next.js: https://github.com/advisories/GHSA-mcj8-r9mp-w47p
Pooler serverless: https://supabase.com/docs/guides/database/connecting-to-postgres

Migrasi diterapkan pada database yang dirujuk .env.local. Perubahan aplikasi membutuhkan deployment baru. Tidak ada akun, transaksi, atau riwayat lama yang dihapus.
