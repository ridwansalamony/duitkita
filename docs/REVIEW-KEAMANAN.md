# Review kode, keamanan, optimasi dan pembersihan

Tanggal pemeriksaan: 25 Oktober 2026. Semua perubahan audit ini berada di source lokal. Tidak ada push GitHub, deployment VPS/Vercel, migrasi Supabase jarak jauh, atau penghapusan data pengguna.

## Lingkup dan temuan

Pemeriksaan mencakup dependensi langsung/transitif, Server Actions, route API, middleware, sesi/cookie, konteks transaksi Drizzle, query keluarga, migrasi RLS/trigger, unggahan struk, PWA/cache, ekspor laporan, state klien, konfigurasi build dan CI. Lint/typecheck dan tes regresi memeriksa seluruh pohon source yang tercakup konfigurasi proyek. Ini bukan sertifikasi bahwa semua kemungkinan kerentanan telah ditemukan.

| Temuan                                                                   | Perbaikan lokal                                                                                                                                                                                          | Bukti                                                                                                           |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| PostgreSQL menerima `NaN` pada numeric dan `amount > 0` tidak menolaknya | Migrasi `0008_nominal_finite.sql` menolak NaN transaksi, target, saldo target, budget dan kontribusi lama; skema Drizzle diselaraskan                                                                    | PGlite mereproduksi bypass lalu menguji penolakan transaksi/budget/target dan penerimaan nominal 0,01           |
| Sesi dicabut atau akun berganti tetapi UI keluarga lama masih tampil     | API workspace mengembalikan 401/403 yang sesuai; provider menyembunyikan UI lalu berpindah. Respons `unchanged` tetap membawa identitas terverifikasi; provider di-key berdasarkan keluarga dan pengguna | Tes 401/403, pergantian akun dengan revisi sama, dan regresi feedback                                           |
| Pemeriksaan file hanya mengandalkan MIME dan signature                   | Decode JPG/PNG di server dengan Sharp, maksimum 20 juta piksel, satu frame, resize maksimum 1600px, metadata dibuang, output JPEG, waktu pemrosesan dibatasi                                             | File palsu/rusak, MIME palsu, file kosong/besar, dimensi berlebihan dan metadata diuji                          |
| Body unggahan bisa menggantung atau memalsukan Content-Length            | Byte stream dibatasi 6 MB dan deadline 20 detik; stream dibatalkan ketika gagal. Batas file tetap 5 MB                                                                                                   | Tes stream tanpa header, header palsu/rusak, ukuran aktual, dan stream macet termasuk cancel yang tidak selesai |
| I/O Storage menahan slot koneksi database                                | Preflight Storage dilakukan setelah Auth/rate limit dan sebelum transaksi. Family filter dan trigger tetap memeriksa data saat write                                                                     | Tes boundary memastikan pengguna anonim/preflight gagal tidak mengambil koneksi                                 |
| Verifikasi Auth/profil berulang dalam layout dan laporan                 | Layout memakai satu workspace terverifikasi; laporan memverifikasi identitas dan admission di lapisan data                                                                                               | Build/typecheck, tes identitas dan regresi laporan                                                              |
| Banyak pencarian per-item terhadap seluruh daftar transaksi              | Diff niat mutasi memakai Map/Set; saldo optimistis menghitung ledger dalam lintasan tunggal; normalisasi target memakai agregat per keluarga; filter/sort transaksi dimemoisasi                          | Regresi transaksi, kategori, target dan saldo                                                                   |
| Penjumlahan optimistis memakai pecahan biner                             | Akumulasi saldo optimistis memakai sen/BigInt sebelum dikembalikan ke model angka UI; batch debit tidak dapat memakai saldo yang sama dua kali                                                           | Tes sen 0,1 + 0,2, batch debit, CRUD transfer dan saldo nol                                                     |
| Metadata IP audit mempercayai forwarding header pengguna                 | IP hanya diambil dari header Vercel pada deployment Vercel dan divalidasi sebagai IP; pada VPS yang trust boundary-nya belum ditetapkan, IP dibiarkan kosong                                             | Tes spoofing header dan limiter                                                                                 |
| Bucket limiter penuh turut menolak bucket aktif                          | Bucket baru ditolak saat kapasitas penuh, bucket aktif tetap mengikuti kuotanya; pembersihan periodik dan expiry tetap diberlakukan                                                                      | Tes 10.000 bucket, expiry dan lonjakan mutasi                                                                   |
| Permukaan source dan dependency berlebih                                 | Komponen tidak dipakai, Server Action upload lama, wrapper mutasi/query tak terpakai dan paket `cn` dihapus                                                                                              | Pemeriksaan referensi, Knip, build dan regresi                                                                  |
| Artefak build ikut dianalisis lint/typecheck                             | Pola ignore mencakup seluruh `.next*`; tersedia cleanup berbatas path; typecheck membuat route types terlebih dahulu                                                                                     | Lint/typecheck dan dry-run cleanup                                                                              |

## Dependensi dan konfigurasi

Next.js serta eslint-config-next diperbarui dari 15.5.27 ke **15.5.28**, tetap pada major Next.js 15. Zod diperbarui ke **4.6.7**. DOMPurify transitif jsPDF dipastikan **>=3.4.17** melalui override. Esbuild transitif loader Drizzle memakai versi yang sudah diperbaiki.

Hasil audit dependency terakhir tanggal pemeriksaan: `npm audit --omit=dev` dan `npm audit` melaporkan **0 advisory**. Hasil ini hanya mencerminkan registry advisory pada saat pemeriksaan, bukan jaminan tidak ada kerentanan yang belum dipublikasikan.

Script lokal `scripts/secure-tooling.mjs` membatasi kedalaman parser/walker pada dependency tooling. Mitigasi diterapkan melalui script npm postinstall dan diuji pada dependency transitif yang benar-benar dipakai plugin lint Next. Glob biasa tetap bekerja; pola dan AST dalam ditolak dengan error terkontrol. Jangan menghapus script mitigasi tanpa memperbarui konfigurasi dan tesnya.

`cn` diganti helper `clsx`/`tailwind-merge` yang sudah tersedia. Sharp dijadikan dependency eksplisit untuk sanitasi struk. Package manager menggunakan npm, Node tetap 24, dan `.env.local` tidak diubah. Header X-Powered-By dinonaktifkan; HSTS dipasang pada konfigurasi URL HTTPS di luar development. Cookie sesi memakai URL deployment yang dipercaya untuk atribut Secure. CSP, HttpOnly, SameSite, nosniff, anti-frame dan no-store tetap dipertahankan.

Middleware tidak lagi meminta Auth untuk halaman pemasaran/aset yang tidak membutuhkan sesi. API dan Server Actions tetap memverifikasi identitas sendiri; pembatasan tidak bergantung pada middleware saja.

## Isolasi database

Identitas berasal dari Supabase `getUser`, bukan metadata browser. Keanggotaan keluarga dibaca dari profil terproteksi. Query keuangan menyertakan filter keluarga dan transaksi menjalankan `SET LOCAL ROLE authenticated` serta claims lokal. Konteks bootstrap profil menggunakan ID akun terverifikasi karena family_id belum diketahui. Pool global maksimal dua koneksi/proses, prepared statement nonaktif; statement/lock/idle transaction timeout dipertahankan.

RLS, hak kolom profil, guard referensi keluarga, saldo, target unik dan pembatas tulis database diuji melalui migrasi aktual pada PostgreSQL sementara PGlite. Pengguna anonim, JWT keluarga palsu, keluarga lain dan anggota yang dicabut diuji. Batch debit berlebih harus rollback seluruhnya.

**Migrasi 0008 baru disiapkan dan diuji lokal, belum diterapkan pada Supabase Anda.** Constraint memakai NOT VALID untuk mempertahankan baris lama; semua INSERT/UPDATE baru diperiksa. Script `scripts/audit-database.mts` diperluas untuk memeriksa constraint dan mendeteksi NaN lama tanpa mencetak data pribadi. Jangan mengganti nominal lama secara otomatis dengan nol.

Tidak ada tabel, akun Auth, foto, atau riwayat keuangan yang dihapus dalam pembersihan source ini. `saving_contributions` serta migrasi/snapshot lamanya dipertahankan karena dibutuhkan kompatibilitas instalasi dan riwayat.

Metadata snapshot Drizzle yang tertinggal dari migrasi SQL manual juga diperbaiki pada `meta/0008_snapshot.json`. Sebelum perbaikan, dry-run generate pada salinan metadata menghasilkan pembuatan ulang indeks/constraint yang sudah ada pada migrasi 0006/0008. Sesudah perbaikan, dry-run pada salinan sementara melaporkan tidak ada perubahan skema; `drizzle-kit check` lulus. Tidak ada file migrasi 0009 yang ditambahkan ke proyek.

## Pembersihan

File source yang terbukti tidak digunakan dan dihapus pada audit ini:

- `src/actions/receipts.ts` (jalur upload lama; aplikasi memakai route upload yang dibatasi).
- `src/components/ui/badge.tsx`, `card.tsx`, `label.tsx`, `select.tsx`, `separator.tsx`, `textarea.tsx`.
- Wrapper CRUD Server Action, wrapper onboarding, dan query export yang tidak memiliki pemanggil juga dihapus tanpa mengubah endpoint UI yang dipakai.

Folder build percobaan `.next-design` sudah dihapus. Cache/build lokal dan laporan sementara dibersihkan melalui daftar path tetap pada `scripts/clean.mjs`. File dari cleanup sebelumnya tetap dihapus: dokumen Fase 1/3, daftar file lama dan screenshot dokumentasi yang sudah tidak relevan.

Yang dipertahankan walaupun scanner import dapat menandainya: service worker yang diregistrasi lewat URL, fixture yang dibundle lewat esbuild, script audit/pool yang dipanggil lewat CLI, model bahasa OCR yang disalin lewat script build, lisensi font, aset ikon/logo, screenshot produk yang dipakai halaman publik, PRD, AGENTS dan SKILL. Scanner bukan dasar tunggal untuk penghapusan.

## Verifikasi akhir

Hasil akhir setelah pembaruan dependency:

- `npm run lint`: lulus.
- `npm run typecheck`: lulus.
- Build produksi mode demo dan mode live: lulus pada Next.js 15.5.28.
- Playwright seluruh suite dengan E2E_OCR=1: **91 lulus, 6 dilewati**, tidak ada kegagalan. Worker OCR nyata termasuk dalam tes yang lulus.
- Pengujian SQL/RLS lokal PGlite: lulus, termasuk migrasi 0008 dan penolakan NaN.
- `npm audit --omit=dev` dan `npm audit`: 0 advisory pada 25 Oktober 2026.
- `npm ci`: lulus.
- `drizzle-kit check` dan dry-run generate pada salinan metadata: lulus, tanpa perubahan skema.

Pemeriksaan SQL lokal tidak memakai database production. Build live menggunakan konfigurasi dummy, URL loopback dan URL database dikosongkan; bukan deployment. Build halaman utama mencatat First Load JS sekitar 144 kB dan dashboard 215 kB. Ini ukuran build, bukan benchmark latensi atau kapasitas pengguna.

Pemeriksaan otomatis menolak menjalankan server uji mode live dengan pesan umum **blocked by policy**, termasuk ketika dibatasi loopback dan tidak membawa kredensial database. Karena itu enam tes HTTP/redirect/SEO khusus live belum dapat dijalankan di sesi ini. Build live dan pengujian boundary server terisolasi merupakan bukti yang berbeda; keduanya tidak boleh dilaporkan sebagai enam tes HTTP tersebut. Workflow CI menyiapkan job live-http untuk menjalankannya tanpa rahasia produksi setelah perubahan dipush dengan izin pemilik.

## Batas dan pekerjaan sebelum rilis

- Audit ini tidak mengubah pengaturan Supabase Auth, URL email, WAF, firewall, backup, secret hosting atau sistem operasi VPS. Itu perlu diverifikasi pada lingkungan rilis.
- Pembatas memori bersifat per instance dan reset saat restart. Batas tulis SQL membantu lintas instance tetapi transaksi gagal/rollback tetap memakai sumber daya. Bukan pengganti proteksi jaringan atau load test staging.
- Snapshot workspace masih memuat seluruh riwayat keluarga ketika ada perubahan. Pencarian/perhitungan klien diperbaiki, tetapi riwayat sangat besar memerlukan pagination server dan agregasi dashboard/budget yang dirancang bersama agar saldo tidak terpotong diam-diam.
- Akumulasi UI/report masih memiliki batas representasi Number pada nilai total sangat besar; ledger otoritatif PostgreSQL memakai numeric. Tidak ada benchmark yang membuktikan kapasitas pengguna tertentu atau kebal terhadap bom request.
- URL struk bertanda tangan merupakan bearer link berumur satu jam. Pencabutan keanggotaan mencegah request baru, tetapi tautan yang sudah diterbitkan berlaku sampai kedaluwarsa.
- Sanitasi gambar berlaku pada jalur upload aplikasi. Upload Storage langsung tetap mengikuti policy folder, MIME dan batas ukuran bucket Supabase; aturan database tidak melakukan decode gambar.
- CSP masih mengizinkan inline script/style yang diperlukan konfigurasi Next/tema saat ini. Tidak ada interpolasi HTML pengguna yang ditambahkan; JSON-LD existing meng-escape karakter `<`. Nonce CSP merupakan perubahan arsitektur rendering tersendiri, belum diterapkan.
- Audit desain publik sebelumnya masih mencatat LCP simulasi mobile 3,0 detik (target <2,5 detik). Ini belum merupakan hasil Core Web Vitals production. Lihat `REDESIGN-PUBLIK.md`.
- Belum ada commit, push, deployment, atau migrasi database jarak jauh dalam pekerjaan ini. Sebelum rilis: jalankan tes live-http, terapkan migrasi 0008 pada database tujuan yang benar, lakukan audit database read-only, lalu smoke test Auth/CRUD/Storage pada staging.

## Menjalankan pemeriksaan

```sh
npm ci
npm run lint
npm run typecheck
npm run test:db
npm run test:security
npm audit --omit=dev
npm audit
```

Untuk regresi UI, jalankan build/server demo, set E2E_OCR=1 pada proses Playwright, lalu jalankan seluruh suite. Enam tes khusus live memerlukan build/server live terisolasi dan E2E_LIVE=1 serta E2E_LIVE_HTTP=1. Jangan menjalankan fixture demo terhadap database production.

Pembersihan: hentikan server lokal, jalankan `npm run clean -- --dry-run`, lalu `npm run clean`. Perintah `npm run clean -- --tests` juga menghapus hasil pengujian. Script menolak symlink/junction dan tidak menerima path penghapusan bebas. Source, .env.local, node_modules dan database tidak termasuk target.

## Referensi primer

- [Next.js Data Security](https://nextjs.org/docs/15/app/guides/data-security)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Sharp security](https://sharp.pixelplumbing.com/security/)
- [Next Image Optimization advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw)
- [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- [DOMPurify advisory](https://github.com/advisories/GHSA-cg2g-xh64-v4q7)
- [Braces advisory dan mitigasi lokal](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
