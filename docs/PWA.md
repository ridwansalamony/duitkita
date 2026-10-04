# Instalasi DuitKita

PWA memakai nama, simbol logo, warna, stack, dan autentikasi DuitKita saat ini. Tidak ada variabel environment atau migrasi database tambahan.

- Deploy perubahan melalui alur Vercel yang sudah digunakan. HTTPS diperlukan; localhost dapat digunakan untuk pengujian.
- Android: tersedia panduan instal manual melalui menu Chrome ketika prompt belum tersedia. Ketika browser menyediakan prompt, panduan berganti menjadi tombol **Instal DuitKita**. Ketersediaan pemasangan ditentukan browser; simulator hanya meniru perangkat dan tidak menjamin prompt instalasi native muncul.
- iPhone/iPad: buka lewat Safari → Bagikan → Tambahkan ke Layar Utama → Buka sebagai App Web jika tersedia.
- Ajakan tampil pada ukuran layar mobile, dapat ditutup selama sesi browser, dan disembunyikan dalam mode standalone.
- Aplikasi mulai di `/dashboard`; middleware autentikasi yang sudah ada mengarahkan pengguna tanpa sesi ke halaman masuk.
- Service worker hanya menangani kegagalan navigasi saat offline. Tidak menggunakan Cache Storage, tidak menyimpan halaman akun/struk/data keluarga, tidak mengantre transaksi, dan tidak mengintersep POST maupun fetch API. Operasi keuangan tetap membutuhkan internet.
- Service worker aktif pada build production saja. Header no-store memastikan browser memeriksa versi pekerja terbaru.

Verifikasi lokal: `pnpm build`, `pnpm start`, kemudian `pnpm exec playwright test tests/pwa.spec.ts`. Atur `PLAYWRIGHT_BASE_URL` jika menggunakan port berbeda. Tes mencakup manifest/ikon, simulasi prompt browser, petunjuk iPhone, penutupan banner, serta offline dan pemulihan koneksi. Pemasangan native tetap perlu dicoba pada Android/iPhone nyata setelah deployment.

Rujukan: https://nextjs.org/docs/app/guides/progressive-web-apps dan https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent.
