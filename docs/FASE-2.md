# Konfigurasi database DuitKita

## Lingkungan lokal

1. Salin `.env.example` ke `.env.local`, lalu isi konfigurasi Supabase dan database. Jangan commit `.env.local` atau membagikan nilainya.
2. Gunakan `NEXT_PUBLIC_APP_MODE=live` untuk Supabase atau `demo` untuk data contoh Budi & Sari tanpa koneksi database.
3. Ambil connection string dari menu Connect Supabase. Gunakan Transaction Pooler port 6543 untuk `DATABASE_URL` runtime serverless. `DIRECT_URL` dipakai untuk migrasi; Session Pooler port 5432 dapat digunakan bila koneksi langsung IPv6 tidak tersedia. Password dengan karakter khusus harus di-URL-encode.
4. Jalankan `npm run db:check`, kemudian `npm run db:migrate` pada database tujuan yang benar. Migrasi tidak perlu dijalankan ulang hanya karena membersihkan cache lokal.

## Supabase Auth dan Storage

- Aktifkan Authentication → Hooks → Custom Access Token dengan fungsi `public.custom_access_token_hook`. Masuk ulang setelah mengaktifkan hook agar sesi mendapat klaim terbaru.
- Isi Site URL sesuai origin aplikasi. Tambahkan callback `/autentikasi/konfirmasi` dan variasi parameter pemulihan ke Redirect URLs. Gunakan URL production saat deployment; konfigurasi `.env.local` tidak otomatis masuk ke hosting.
- Aktifkan email/password dan konfirmasi email. Template konfirmasi harus memakai tautan konfirmasi Supabase yang benar.
- Bucket struk `receipts` bersifat privat. Akses struk menggunakan URL bertanda tangan dan policy keluarga.
- OCR berjalan di browser melalui Tesseract.js, tanpa API berbayar. `npm run dev` dan `npm run build` membuat ulang aset OCR lokal.
- Pengaturan publication dan policy Realtime tersedia dalam migrasi. Autentikasi dan RLS tetap menjadi pengaman data.

## Model data dan keamanan

- Identitas keluarga berasal dari keanggotaan terverifikasi di server; query keuangan difilter dengan `family_id` dan dilindungi RLS.
- Seluruh dompet dipakai bersama keluarga. Dompet utama menjadi pilihan awal transaksi; target tabungan terhubung ke dompet unik dan mengikuti saldo dompet tersebut.
- Transfer dan mutasi saldo dijalankan secara atomik. Trigger database memeriksa saldo dan mencatat audit.
- Pembatas request aplikasi memakai memori per instance. Batas tulis database tetap berlaku lintas instance. Upstash tidak digunakan.
- Migrasi `0008_nominal_finite.sql` menolak nominal `NaN` pada jalur SQL/PostgREST. Migrasi ini disiapkan dalam review 25 Oktober 2026 dan perlu diterapkan ke database tujuan pada proses rilis; audit source tidak otomatis menerapkannya.
- Snapshot Drizzle terbaru adalah `meta/0008_snapshot.json`. Jangan menghapus metadata migrasi: metadata yang tertinggal dapat membuat `db:generate` menghasilkan indeks atau constraint duplikat. `npx --no-install drizzle-kit check` memeriksa konsistensi rantai snapshot.
- `SUPABASE_SERVICE_ROLE_KEY` hanya untuk administrasi server. Jangan gunakan prefiks `NEXT_PUBLIC_` untuk rahasia database atau service-role key.

## Pengujian

```sh
npm run test:db
npm run lint
npm run typecheck
npm run build
```

Pengujian browser membutuhkan server mode demo. Hasil dan screenshot ditulis ke `test-results/`, yang diabaikan Git. Jangan menjalankan fixture demo terhadap database production.

Lihat `REVIEW-KEAMANAN.md` untuk batas kapasitas dan catatan audit, `PWA.md` untuk pemasangan aplikasi, serta `SEO.md` untuk pengaturan indeks dan Search Console.
