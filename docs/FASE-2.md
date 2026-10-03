# Fase 2 — backend dan integrasi DuitKita

Status: migrasi Supabase berhasil diterapkan dan uji database langsung lulus; aktivasi Auth Hook serta pengujian alur akun/Storage/Realtime lewat aplikasi masih perlu diselesaikan. Fase 3 belum dimulai.

## Cakupan yang ditambahkan

| Task PRD | Implementasi | Verifikasi tersisa |
|---|---|---|
| 2.1 | Delapan tabel Bab 10, migrasi Drizzle, RLS, bucket privat `receipts`, seed otomatis saat keluarga dibuat | Selesai: migrasi diterapkan, 8 tabel dengan RLS, bucket privat, dan seed diuji di Supabase |
| 2.2 | Daftar, masuk, keluar, verifikasi email, pemulihan kata sandi, buat/gabung keluarga, middleware, custom access token hook | Aktifkan hook di dashboard; uji email dan sesi nyata |
| 2.3 | Server Actions tervalidasi Zod, query keluarga, audit trigger, saldo agregat, kontribusi atomik, arsip target | Uji CRUD melalui aplikasi terhadap database eksternal |
| 2.4 | Resize hingga 1600 px, pemeriksaan signature JPG/PNG dan 5 MB, unggah privat, streaming status, Tesseract.js di browser, saran isian dan penyimpanan metadata OCR | Unggah/unduh Storage live; tolok ukur akurasi beragam struk/perangkat |
| 2.5 | Provider data langsung, optimistic UI/rollback, umpan balik saat commit, Realtime audit terfilter keluarga | Uji sinkronisasi dua sesi pengguna pada Supabase |

## File utama

- `src/db/schema.ts`, `src/db/index.ts`, `src/db/queries.ts`: skema Bab 10, koneksi Drizzle, transaksi dengan identitas terverifikasi, snapshot dan helper query.
- `supabase/migrations/0000_rare_gambit.sql`, `0001_isolasi_keluarga.sql`: tabel, constraint, RLS, fungsi bootstrap/undangan, audit, Storage, publication Realtime.
- `drizzle.config.ts`, `scripts/database.mts`, `scripts/test-database.mts`: generate/migrate, pemeriksaan koneksi tanpa mencetak rahasia, pengujian PostgreSQL lokal melalui PGlite.
- `src/actions/auth.ts`, `finance.ts`, `receipts.ts`: autentikasi, mutasi data, dan unggah privat.
- `src/middleware.ts`, `src/lib/supabase/server.ts`: proteksi rute, verifikasi sesi, cookie HttpOnly dan SameSite.
- `src/lib/workspace/provider.tsx`, `intent.ts`, `optimistic.ts`: penghubung komponen yang sudah ada ke server, pemilihan satu operasi mutasi, saldo sementara, pembatalan tampilan optimistis jika simpan ditolak.
- `src/lib/receipts/image.ts`, `server.ts`, `ocr.ts`, `parse.ts`: resize, unggah privat, worker Tesseract.js browser, parser konservatif struk Indonesia. `scripts/prepare-ocr.mjs` menyalin aset worker/WASM/bahasa ke `public/ocr/` saat dev/build.
- `src/app/api/ocr/pratinjau/route.ts`: unggah dan progres NDJSON, proteksi origin, sesi, dan batas ukuran request.
- `src/app/(public)/autentikasi/konfirmasi/route.ts`, `atur-kata-sandi/page.tsx`, `src/features/public/recovery.tsx`: callback email dan penggantian kata sandi.
- Komponen fitur yang sudah ada disambungkan ke provider tersebut. Rute aplikasi dan desain dipertahankan. Halaman masuk/daftar/pengaturan awal kini menampilkan alur nyata dalam mode `live`.
- `tests/workspace-intent.spec.ts`, `tests/phase-two-public.spec.ts`: operasi majemuk UI, saldo optimistis, proteksi halaman live dan endpoint OCR.

## Isolasi dan integritas

1. Keluarga tidak diambil dari form. Server memverifikasi akun melalui `auth.getUser()`, lalu membaca keanggotaannya. Query keuangan selalu menyertakan `family_id`; kontribusi memakai relasi ke target keluarga. Pembacaan profil sendiri sebelum onboarding adalah pengecualian bootstrap, berfilter `auth.uid()`.
2. Setiap transaksi Drizzle menjalankan `SET LOCAL ROLE authenticated` dan klaim yang berasal dari keanggotaan database. RLS tetap aktif meskipun URL koneksi menggunakan akun database administratif. GUC identitas otomatis dibersihkan setelah transaksi.
3. JWT untuk akses Storage dan Realtime diterbitkan Supabase melalui `custom_access_token_hook`. `in_family` memeriksa klaim sekaligus keanggotaan aktual agar JWT anggota yang dikeluarkan tidak membuka data lama.
4. Dompet pribadi dan transaksi terkait hanya dapat dibaca pemilik. Agregat saldo keluarga boleh mencakup dompet pribadi tanpa mengirim detailnya. Kontribusi keluarga tetap terlihat; nama/ID dompet pribadi dan catatan kontribusinya disamarkan bagi pasangan.
5. Audit mencatat sebelum/sesudah dari trigger database dan tidak dapat dimutasi pengguna. Penanda pemilik pribadi disimpan pada snapshot log, termasuk jika catatannya dihapus.
6. Undangan tujuh hari, maksimal dua anggota, pembuatan keluarga dan seed atomik, kontribusi memakai kunci baris untuk mencegah pengeluaran ganda secara bersamaan. Target diarsipkan, bukan dihapus permanen.
7. Service-role key tidak digunakan oleh jalur aplikasi. Token Realtime berada di memori browser, tidak dipersist ke localStorage. Koneksi transaksi baru memakai filter `family_id=eq.<id>` dan RLS; polling 15 detik saat tab terlihat juga menangani penghapusan serta perubahan entitas lain.

## Aktivasi Supabase

1. Isi `.env.local` dari `.env.example`; gunakan `NEXT_PUBLIC_APP_MODE=live` (atau biarkan tidak diisi; default adalah live).
2. Dari **Connect** di Supabase, salin **Session Pooler** untuk `DIRECT_URL` dengan port **5432** bila host database langsung tidak bisa dijangkau melalui IPv6. `DATABASE_URL` dapat memakai Transaction Pooler **6543** atau Session Pooler **5432**. Gunakan password database yang benar; karakter khusus pada password harus di-URL-encode. Jangan memakai anon/service key sebagai password database.
3. Jalankan `pnpm db:check`, lalu `pnpm db:migrate`. Skema dihasilkan dengan `drizzle-kit generate`; perintah migrate menggunakan migrator resmi Drizzle dengan penanganan error yang tidak mencetak connection string.
4. Pada **Authentication → Hooks → Custom Access Token**, pilih fungsi PostgreSQL `public.custom_access_token_hook` dan aktifkan. Simpan perubahan. Langkah ini diperlukan sebelum menguji Storage dan Realtime.
5. Pada **Authentication → URL Configuration**, isi Site URL sesuai `NEXT_PUBLIC_APP_URL`. Daftarkan callback `http://localhost:3000/autentikasi/konfirmasi` serta URL callback dengan parameter `next` untuk verifikasi/pemulihan (wildcard lokal `http://localhost:3000/**` dapat digunakan selama pengembangan). Gunakan origin produksi yang tepat saat rilis.
6. Pastikan email/password dan verifikasi email aktif. Uji pengiriman verifikasi dan reset dengan email yang Anda kuasai. Pengaturan email Supabase dapat membatasi jumlah pengiriman selama pengembangan.
7. OCR memakai Tesseract.js tanpa API key. Model Indonesia/Inggris dan worker dilayani aplikasi sendiri. `pnpm dev`/`pnpm build` menyiapkan aset otomatis. Foto tetap terlampir jika pembacaan gagal/dibatalkan. Target < 8 detik/85% akurasi PRD belum dapat dinyatakan tercapai tanpa sampel struk nyata dan perangkat representatif; batas tunggu 60 detik. Hosting dan Storage tetap mengikuti kuota paket layanan.
8. Masuk ulang setelah hook diaktifkan agar sesi mendapat klaim baru. Akun pertama membuat keluarga; akun pasangan bergabung melalui kode. Keluarga baru dimulai kosong dengan dompet/kategori bawaan, tanpa menyisipkan transaksi keuangan fiktif.

Konfigurasi terakhir yang diperiksa (1 Oktober 2026, setelah pembaruan password): `DATABASE_URL` dan `DIRECT_URL` berhasil terhubung menggunakan Session Pooler port 5432 dan cocok dengan proyek Supabase pada konfigurasi aplikasi. Pengujian memakai kedua URL persis dari `.env.local`, tanpa mengganti port. Error `ENOTFOUND`/`28P01` sebelumnya tidak muncul lagi. Migrasi `0000_rare_gambit` dan `0001_isolasi_keluarga` kemudian berhasil diterapkan atas instruksi pengguna. Delapan tabel memakai RLS, 17 policy public tersedia, bucket `receipts` privat (5 MB), dan tabel transaksi terdaftar pada publication Realtime. Fungsi token hook tersedia dan dapat dieksekusi `supabase_auth_admin`; status aktivasi hook di dashboard belum diverifikasi. `.env.local` tidak diubah dan Fase 3 belum dijalankan.

## Verifikasi migrasi Supabase langsung

- `pnpm db:migrate` berhasil.
- Uji dalam transaksi database: trigger profil dari `auth.users`, buat keluarga Budi & Sari, seed 1 dompet dan 13 kategori, simpan transaksi, audit log otomatis, serta penolakan akses ketika klaim keluarga dipalsukan semuanya lulus.
- Seluruh data uji di-rollback, termasuk akun Auth sementara; tidak mengirim email. Ini uji SQL langsung, belum menggantikan uji pendaftaran/login pengguna dari browser.
- Langkah pengguna berikutnya: aktifkan Custom Access Token Hook dan periksa URL Configuration sesuai panduan di atas, lalu coba daftar/masuk dan buat keluarga.

## Pemeriksaan lokal

- TypeScript dan ESLint lulus.
- Pengujian PostgreSQL PGlite lulus: pembuatan/seed keluarga, batas dua anggota, keluarga ganda, klaim keluarga palsu, akses lintas keluarga, dompet/audit privat, transfer, agregat, lampiran struk, fallback kategori, larangan mengganti keluarga, arsip target, nominal kontribusi, dan akses anggota setelah dikeluarkan.
- 13 pengujian regresi dan state lulus, termasuk tampilan desktop/mobile, dark mode, CRUD, transfer, kontribusi, profil, dan menu anggota.
- Perbaikan animasi `Reveal`: markup awal konsisten saat reduced motion aktif sehingga isi dashboard tidak tertinggal transparan setelah hydration.
- Build produksi `pnpm build` lulus untuk 27 entri halaman/handler.
- Tiga pengujian mode live lulus: proteksi halaman tanpa sesi, penolakan origin asing/pengguna anonim pada OCR, serta callback yang tidak mengalihkan ke situs luar. Callback memakai origin aplikasi yang dikonfigurasi, bukan alamat bind `0.0.0.0`.

Screenshot regresi tersedia di `docs/screenshots/`. `fase-2-masuk.png` menunjukkan halaman autentikasi mode live. Screenshot dashboard menggunakan mode demo Budi & Sari, sehingga bukan bukti koneksi database eksternal. Server pratinjau produksi terakhir dijalankan di `http://localhost:3000`.

## Penggantian OCR ke Tesseract.js

- Sesuai pilihan pengguna, dependensi OpenAI dan pemanggilan API Vision dihapus. `.env.example`, README, dan bagian OCR PRD diperbarui; `.env.local` tetap milik pengguna dan tidak diedit.
- Pembacaan menggunakan Web Worker/WASM dengan bahasa `ind` dan `eng`, dimuat saat pengguna memilih foto. Aset dilayani dari origin aplikasi, tanpa CDN atau API OCR eksternal.
- Parser membedakan TOTAL dari SUBTOTAL/TUNAI/KEMBALI, mendukung format Rupiah dan tanggal numerik. Nilai ambigu atau tidak terbaca dibiarkan kosong. Ini parser heuristik, sehingga pengguna harus meninjau saran.
- Halaman `/transaksi/baru` dan formulir ubah transaksi memakai editor yang sama. Saran tidak menimpa isian sampai pengguna menekan **Gunakan Saran**. Progres, pembatalan, kegagalan worker, dan hasil kosong mempertahankan lampiran serta isian manual.
- File baru: `src/lib/receipts/ocr.ts`, `parse.ts`, `scripts/prepare-ocr.mjs`, `tests/receipt-parser.spec.ts`, dan `tests/receipt-ocr.spec.ts`. File yang diperbarui: `src/features/transactions/editor.tsx`, `src/features/public/marketing.tsx`, `src/lib/receipts/server.ts`, `src/actions/receipts.ts`, `src/app/api/ocr/pratinjau/route.ts`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.gitignore`, `eslint.config.mjs`, `.env.example`, `README.md`, `PRD.md`, dan laporan ini. Tidak ada perubahan skema database atau struktur rute.
- 20 tes lokal lulus: 13 regresi/state, 3 parser, dan 4 browser OCR (gambar nyata, kosong, worker gagal, pembatalan). Struk sintetis Sate Padang Ajo terbaca Rp87.500, tanggal 2026-09-30, dan nama toko. Tes memastikan tidak ada request keluar origin selama pembacaan. Hasil ini bukan tolok ukur akurasi struk dunia nyata.
- Pratinjau: `docs/screenshots/fase-2-ocr-tesseract.png` (mode demo Budi & Sari dengan OCR nyata, tanpa penyimpanan Supabase).

## Referensi implementasi

- [Supabase server-side Auth](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook)
- [Drizzle Row-Level Security](https://orm.drizzle.team/docs/rls)
- [Tesseract.js API](https://github.com/naptha/tesseract.js/blob/master/docs/api.md)
- [Tesseract.js local installation](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md)

## Perbaikan batas koneksi Session Pooler

Error `EMAXCONNSESSION` terjadi setelah pool pada scope modul bertambah ketika Next.js memuat ulang modul. `src/db/connection.ts` sekarang menyimpan satu pool pada `globalThis` per proses, membatasi `max: 2`, melepas koneksi idle setelah 20 detik, dan merotasi koneksi setelah 600 detik. `src/db/index.ts` memakai pool tersebut; `SET LOCAL ROLE` dan klaim keluarga tetap dibatasi transaksi. Server lokal dimulai ulang untuk melepaskan pool lama. Konfigurasi `.env.local` dan data tidak diubah.

Verifikasi: `pnpm exec tsx scripts/test-database-pool.mts` berhasil menjalankan 20 pemuatan ulang modul dengan pool yang sama serta 30 transaksi paralel terhadap Supabase. Identitas setiap transaksi sesuai dan role/klaim tidak tertinggal setelah transaksi. Pengujian tidak menulis data. Batas dua koneksi berlaku per proses aplikasi, bukan untuk seluruh deployment multi-instance.

## Sinkronisasi CRUD dan indikator proses — 2 Oktober 2026

- `src/lib/workspace/provider.tsx`: hasil `update()` selesai saat mutasi server committed, tidak menunggu snapshot seluruh keluarga. Refresh memakai GET privat `src/app/api/ruang-keluarga/route.ts`, terpisah dari antrean Server Actions. Respons lama dicegah menimpa mutasi baru melalui revision counter, abort, dan refresh susulan. Gagal refresh tidak membatalkan hasil simpan; UI memberi opsi sinkronisasi ulang. Penghapusan ditampilkan setelah commit agar halaman/dialog tidak lenyap sebelum permintaan selesai.
- `src/actions/finance.ts`: mutasi undangan/keluarga/anggota mengembalikan nilai keluarga resmi, sehingga kode undangan baru tidak menunggu refresh. Query metadata audit ganda dihapus. `src/db/index.ts` menggabungkan pengaturan metadata audit dan klaim awal dalam satu query; role/klaim tetap lokal pada transaksi.
- `src/db/queries.ts`: koneksi database dilepas sebelum meminta signed URL ke Storage.
- `0002_realtime_aktivitas.sql`: menambahkan `audit_logs` ke publication Supabase Realtime; telah diterapkan. Provider berlangganan INSERT audit terfilter `family_id` sehingga perubahan/hapus berbagai entitas turut memicu refresh. RLS audit dan privasi dompet tetap berlaku. Polling tetap tersedia sebagai fallback, termasuk perubahan privat yang tidak boleh mengirim detail audit ke pasangan.
- `src/components/ui/request-form.tsx` dan `button.tsx`: spinner, teks Memproses, disabled, aria-busy, serta kunci submit/click ganda. Diterapkan pada transaksi, dompet, kategori, tabungan/kontribusi, pengaturan, profil, autentikasi, pengaturan awal, dan pemulihan sandi. Unggah foto/struk dan keluar akun mendapat indikator proses masing-masing.
- `tests/workspace-feedback.spec.ts` memakai komponen React asli dengan transport terkontrol untuk menguji commit vs refresh lambat, rollback, kegagalan refresh, tombol async, serta event audit Realtime. `tests/fixtures/workspace-harness.tsx` hanya fixture pengujian dan tidak menambah halaman aplikasi. Ini bukan pengujian dua akun Supabase melalui browser.
- Fase 3 belum dimulai.

Verifikasi perbaikan sinkronisasi: 20 tes regresi/state/parser lolos pada server development; pemeriksaan screenshot grafik tidak konsisten pada development tetapi lulus saat diuji ulang pada build produksi (desktop/mobile/dark mode). Lima skenario transport terkontrol termasuk dalam tes tersebut. TypeScript, ESLint, pengujian SQL/RLS lokal, serta build produksi lulus. Publication Supabase telah diverifikasi berisi `audit_logs` dan `transactions`. Screenshot `docs/screenshots/fase-2-proses-simpan.png` menggunakan komponen asli dengan data Budi & Sari dan respons simpan yang ditahan dalam pengujian.

## Perbaikan notifikasi logout — 2 Oktober 2026

- `src/actions/auth.ts` sekarang memeriksa hasil `signOut()` dan mengembalikan status eksplisit. Pengalihan `redirect()` sebelumnya dapat tertangkap oleh catch di klien sebagai kegagalan meski sesi sudah dihapus.
- `src/components/layouts/logout-menu-item.tsx` menangani indikator Keluar…, mencegah klik ganda, dan memindahkan browser ke `/masuk` dengan `location.replace()` hanya setelah hasil sukses. UI tetap sibuk sampai navigasi selesai. Kegagalan nyata menampilkan notifikasi dan mengaktifkan kembali tombol.
- `src/components/layouts/app-shell.tsx` menggunakan komponen menu tersebut. Struktur rute dan data keluarga tidak diubah.
- Dua pengujian browser terkontrol pada `tests/logout-feedback.spec.ts` lulus: logout berhasil tanpa notifikasi gagal serta logout gagal yang dapat dicoba kembali. Lima tes sinkronisasi CRUD juga tetap lulus. Pengujian ini memakai respons autentikasi tiruan, bukan mengeluarkan akun pengguna dari Supabase.

## Dompet bersama dan target terhubung — 2 Oktober 2026

Menggantikan mekanisme dompet pribadi dan kontribusi manual dalam catatan sebelumnya, sesuai perubahan pengguna sebelum Fase 3.

- Semua dompet milik bersama; owner dan member dapat membuat/mengubah dompet. `is_primary` menentukan satu Dompet Keluarga sebagai pilihan awal transaksi untuk kedua pengguna. Dompet utama tidak dapat dihapus atau dialihkan lewat CRUD.
- Target wajib memilih dompet. Satu dompet hanya untuk satu target yang belum diarsipkan. Saldo lama dompet langsung menjadi progres; transfer masuk, transfer keluar, pemasukan, pengeluaran, edit, dan hapus transaksi memperbarui saldo/status target. Status tercapai kembali aktif jika saldo turun. Arsip tidak memindahkan dana dan tidak masuk penjumlahan target berjalan.
- Detail target menampilkan saldo dan riwayat dompet, dengan tautan Transfer ke Tabungan yang mengisi dompet tujuan. Tidak ada form kontribusi per anggota. Total keluarga dan laporan tidak menghitung transfer sebagai pemasukan/pengeluaran.
- Migrasi `supabase/migrations/0003_tabungan_dompet_bersama.sql` sudah diterapkan di Supabase: dompet pribadi menjadi shared; setiap target lama memperoleh dompet khusus; kontribusi lama menjadi transfer bertanggal asli (catatan tanpa sumber menjadi pemasukan ke dompet target). Catatan kontribusi asli tetap tersimpan sebagai arsip baca, tanpa ikut agregat. Pemeriksaan saldo dalam transaksi membatalkan seluruh migrasi jika konversi tidak cocok. Tipe enum `personal` hanya dipertahankan demi kompatibilitas skema lama; constraint menolak dompet pribadi baru.
- Relasi target-dompet memakai FK gabungan `wallet_id, family_id`, indeks unik target/dompet, dan RLS keluarga. Fungsi ledger internal tidak dapat dipanggil oleh anon/authenticated. Trigger memperbarui target setelah mutasi transaksi; kunci keluarga menserialisasi mutasi transaksi/target.
- PRD Bab 6, 9, 10, dan task terkait serta README diperbarui. Halaman terdampak: Dompet, Tabungan/detail, Catat Transaksi, Dasbor, Laporan, dan copy publik. Struktur rute tetap.

File utama: `src/db/schema.ts`, `src/db/queries.ts`, `src/actions/finance.ts`, `src/lib/dummy/{data.ts,store.tsx}`, `src/lib/workspace/{intent.ts,optimistic.ts,provider.tsx}`, `src/features/{wallets/wallets.tsx,goals/goals.tsx,transactions/editor.tsx,dashboard/dashboard.tsx,reports/reports.tsx,public/marketing.tsx,settings/settings.tsx}`, `src/app/(app)/transaksi/baru/page.tsx`, migrasi dan snapshot `0003`, `scripts/test-database.mts`, serta tes terkait.

Verifikasi: pengujian SQL/RLS lokal mencakup upgrade data lama, larangan kontribusi baru, isolasi keluarga, akses pasangan, dompet utama, relasi target unik, perubahan/hapus transfer, perubahan dompet target, serta arsip. Pemeriksaan read-only Supabase menemukan 0 dompet non-shared, 0 keluarga tanpa tepat satu dompet utama, dan 0 target dengan relasi/saldo tidak sesuai. Sepuluh tes UI regresi, dua tes alur dompet-target, dan sepuluh tes helper/feedback/logout lulus. Build produksi berikut pemeriksaan tipe dan lint lulus. Alur mutasi browser memakai data demo atau transport terkontrol; tidak membuat transaksi uji di keluarga pengguna.

Pratinjau data Budi & Sari: `docs/screenshots/fase-2-target-dompet.png`, `fase-2-target-dompet-mobile.png`, dan `fase-2-pilih-dompet-target.png`. Fase 3 belum dimulai.

## Pencegahan saldo minus — 3 Oktober 2026

- Transfer dan pengeluaran yang melebihi saldo ditolak di formulir serta database. Nominal tepat sejumlah saldo tetap sah. Pemeriksaan edit memperhitungkan selisih terhadap transaksi lama, sehingga mengganti catatan tidak mendebit dua kali.
- `supabase/migrations/0004_cegah_saldo_minus.sql` sudah diterapkan ke Supabase. Trigger BEFORE INSERT/UPDATE/DELETE memeriksa setiap dompet terdampak, termasuk tujuan transfer lama. Kunci keluarga BEFORE STATEMENT dari migrasi 0003 tetap aktif; isolation deployment diverifikasi `read committed`. RLS dan filter keluarga tetap berlaku.
- Menghapus atau mengurangi pemasukan/transfer yang dananya sudah terpakai juga ditolak jika menyebabkan saldo negatif. Saldo minus yang sudah ada tidak diubah oleh migrasi: koreksi yang memperbaiki saldo diizinkan, tetapi debit tambahan ditolak.
- `src/lib/workspace/funds.ts` menjadi perhitungan selisih nominal dalam sen untuk UI; dipakai editor, provider live, dan demo. `src/features/transactions/editor.tsx` mempertahankan isian dan menjelaskan saldo tidak mencukupi sebelum pengiriman. `src/lib/dummy/store.tsx` dan `src/lib/workspace/provider.tsx` turut memeriksa mutasi/hapus, tanpa menampilkan saldo negatif optimistis.
- Tes SQL/RLS lokal mencakup saldo nol, nominal berlebih, pas saldo, edit catatan, edit/hapus dana terpakai, batch dua debit, dan koreksi saldo minus lama. Dua belas tes helper/feedback/logout dan sembilan tes UI terkait lulus. Tes browser memastikan transfer Rp200.000 dari dompet kosong tidak tersimpan. Tidak ada transaksi uji yang dibuat di keluarga pengguna. Typecheck, lint, dan build demo lulus.
- Screenshot: `docs/screenshots/fase-2-saldo-tidak-cukup.png`. Fase 3 belum dimulai.

Referensi teknis untuk visibilitas snapshot fungsi trigger: [PostgreSQL Function Volatility](https://www.postgresql.org/docs/14/xfunc-volatility.html). Pemeriksaan saldo berjalan di trigger PL/pgSQL VOLATILE sesudah kunci keluarga, pada isolation deployment READ COMMITTED. Uji dua koneksi Postgres paralel belum dilakukan; pengujian lokal mencakup mutasi berurutan dan batch statement.


## Penyederhanaan transaksi dan budget kategori — 3 Oktober 2026

Tetap dalam Fase 2; Fase 3 belum dimulai.

- **Transaksi:** struk dan Tesseract.js hanya ditampilkan pada pengeluaran. Pemasukan tetap menyediakan catatan. Transfer hanya nominal, dompet sumber/tujuan, tanggal, dan pencatat; deskripsi otomatis “Transfer antar dompet”. Beralih jenis membatalkan proses OCR dan membuang isian lampiran tersembunyi. Detail struk hanya muncul pada pengeluaran. Server Action serta trigger database menormalkan mutasi yang dikirim langsung.
- **Urutan:** tanggal transaksi DESC, waktu pencatatan DESC untuk tanggal yang sama, lalu ID sebagai penentu urutan konsisten. Berlaku pada query server, daftar transaksi, dan riwayat dompet target. Mengedit nominal tidak mengubah waktu pencatatan awal.
- **Nominal:** komponen CurrencyInput dipakai pada transaksi, target tabungan, dan budget; tampilan 20.000.000,25, nilai tersimpan 20000000.25. Mendukung paste prefiks Rp, penghapusan di dekat pemisah, dan pemulihan nilai OCR.
- **Budget:** diatur melalui Kategori → Ubah kategori → Maksimal budget bulanan (Rp). Batas opsional per kategori pengeluaran, berulang tiap bulan, tidak memindahkan atau mencadangkan saldo. Pemakaian menjumlah pengeluaran semua anggota dalam keluarga dan bulan tanggal transaksi. Kartu menampilkan nominal terpakai, persentase, sisa/kelebihan dan peringatan mulai 80%. Form pengeluaran menampilkan perkiraan setelah simpan dan mengecualikan transaksi yang sedang diedit agar tidak terhitung dua kali. CRUD transaksi, pergantian kategori/bulan, serta sinkronisasi workspace memperbarui angka. Budget boleh dilewati selama saldo mencukupi. Kosongkan batas untuk menonaktifkan. Perubahan batas juga berlaku pada tampilan bulan lampau; versi batas historis dan rollover tidak disediakan.
- **Target:** menu/tab/dialog arsip dihapus; mutasi arsip baru ditolak. Pembuatan atau pergantian dompet target menolak dompet yang sudah ditautkan ke target lain, termasuk arsip lama. Satu arsip lama yang berbagi dompet dengan target berjalan dipertahankan di database tanpa menghapus riwayat atau mengubah saldo, tidak tampil sebagai target berjalan. Target berjalan tetap bisa diedit dengan dompet asalnya.
- **Database:** migrasi 0005_budget_dan_form_transaksi.sql telah diterapkan ke Supabase. Menambah categories.monthly_budget dan constraint, normalisasi transaksi, serta pengaman tautan target. RLS kedelapan tabel tetap aktif. Semua query aplikasi baru tetap mengikuti family_id. Budget keluarga pengguna tidak diisi otomatis; angka contoh Rp2 juta dan lainnya hanya tersedia pada demo Budi & Sari.
- **File utama:** src/features/transactions/{editor,detail}.tsx, src/features/categories/categories.tsx, src/features/goals/goals.tsx, src/components/ui/currency-input.tsx, src/components/shared/budget-progress.tsx, src/lib/currency-input.ts, src/lib/workspace/budget.ts, src/lib/dummy/{data,store}.tsx/ts, src/actions/finance.ts, src/db/{queries,schema}.ts, supabase/migrations/0005_budget_dan_form_transaksi.sql beserta metadata, PRD.md. next.config.ts menyediakan direktori build demo terpisah agar pemeriksaan tidak mengganggu build live.
- **Pratinjau:** docs/screenshots/fase-2-budget-kategori.png, fase-2-budget-mobile.png, dan fase-2-form-transfer-ringkas.png. Data screenshot hanya sesi demo.

- **Verifikasi perubahan transaksi/budget:** tes SQL/RLS lulus; 24 tes regresi/helper lulus, tiga tes dompet/saldo terkait lulus, lima tes OCR nyata/kegagalan/pembatalan lulus (E2E_OCR=1), serta empat tes akses anonim pada build live lulus. Typecheck, lint, dan build produksi berhasil. Pengujian CRUD browser memakai data demo; tidak membuat transaksi uji pada keluarga pengguna.

## Sinkronisasi avatar profil — 3 Oktober 2026

- Komponen `src/components/shared/user-avatar.tsx` membaca `avatarUrl` dan memakai inisial nama sebenarnya ketika foto tidak tersedia atau gagal dimuat.
- `src/components/layouts/app-shell.tsx` dan `src/features/transactions/table.tsx` memakai komponen tersebut. Tabel mengambil pengguna berdasarkan pencatat transaksi dan `familyId`, menggantikan huruf B/S yang sebelumnya ditulis tetap untuk demo. Perubahan mengikuti workspace yang sama tanpa reload.
- Mekanisme penyimpanan tidak diubah: production mengecilkan foto ke sisi terpanjang maksimal 384 px (JPEG), mengubahnya menjadi data URL Base64, lalu menyimpan string pada kolom `public.users.avatar_url` di PostgreSQL Supabase. Server membatasi panjang string 400.000 karakter dan mutasi pada pengguna aktif dalam keluarga. Avatar belum memakai bucket Storage atau filesystem server deployment. Pada demo, perubahan hanya berada dalam state sesi.
- Tes browser `tests/profile-avatar.spec.ts` lulus: perubahan nama menghasilkan inisial R, unggah foto memperbarui navbar dan kolom pencatat tanpa reload, lalu pergantian pengguna tetap menampilkan foto pencatat yang benar dan inisial pengguna yang belum punya foto. Screenshot: `docs/screenshots/fase-2-avatar-transaksi.png`. Fase 3 belum dimulai.

- Verifikasi akhir avatar: tes browser, lint, pemeriksaan TypeScript dalam build, dan build produksi lulus. Server lokal memakai build terbaru.

## Inisial avatar keluarga — 3 Oktober 2026

- Avatar navigasi memakai nama keluarga dari workspace, bukan daftar anggota. Awalan Keluarga diabaikan; nama yang dipisahkan & atau dan mengikuti urutannya. Anto & Dela → AD; Dela & Anto → DA; Sayang & Kamu → SK. Nama tunggal menggunakan satu inisial, nama tanpa pemisah menggunakan maksimal dua kata awal.
- Berlaku pada navigasi desktop dan menu mobile melalui komponen Navigation yang sama, otomatis mengikuti pembuatan dan perubahan nama keluarga. File: src/lib/utils.ts dan src/components/layouts/app-shell.tsx. Enam contoh nama telah diverifikasi.
