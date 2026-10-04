import { test, expect } from "@playwright/test";
import fs from "node:fs";

test("target baru dapat diedit dan tercapai tanpa fitur arsip", async ({
  page,
}) => {
  await page.goto("/dompet");
  await page.getByRole("button", { name: "Tambah Dompet" }).click();
  await page.getByLabel("Nama dompet").fill("Dompet Mesin Cuci");
  await page.getByRole("button", { name: "Simpan Dompet" }).click();
  await page
    .getByRole("link", { name: "Target Tabungan", exact: true })
    .click();
  await page.getByRole("button", { name: "Buat Target", exact: true }).click();
  await page.getByLabel("Nama target").fill("Mesin Cuci Keluarga");
  await page.getByLabel("Target tabungan (Rp)").fill("1000000");
  await page
    .getByRole("combobox", { name: "Dompet tabungan", exact: true })
    .selectOption({ label: "Dompet Mesin Cuci" });
  await page
    .getByRole("button", { name: "Simpan Target", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Mesin Cuci Keluarga", exact: true })
    .click();
  await page.getByRole("button", { name: "Ubah", exact: true }).click();
  await page.getByLabel("Target tabungan (Rp)").fill("750000");
  await page
    .getByRole("button", { name: "Simpan Target", exact: true })
    .click();
  const goalUrl = page.url();
  await page
    .getByRole("link", { name: "Transfer ke Tabungan", exact: true })
    .click();
  await expect(page.getByLabel("Dompet sumber", { exact: true })).toHaveValue(
    "rumah",
  );
  await page.getByLabel("Nominal transaksi").fill("750000");
  await page
    .getByRole("button", { name: "Simpan Transaksi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Transfer antar dompet", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Target Tabungan", exact: true })
    .click();
  await page.getByRole("button", { name: "Semua", exact: true }).click();
  await page
    .locator('a[href="' + new URL(goalUrl).pathname + '"]')
    .first()
    .click();
  await expect(
    page.getByText("Impian ini sudah tercapai. Selamat!"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Arsipkan/ })).toHaveCount(0);
});

test("pengaturan, profil, dan keanggotaan bekerja tanpa menghapus riwayat", async ({
  page,
}) => {
  await page.goto("/pengaturan");
  await page.getByLabel("Nama keluarga").fill("Keluarga Budi & Sari Bahagia");
  await page
    .getByRole("button", { name: "Simpan Perubahan", exact: true })
    .click();
  await expect(page.getByLabel("Nama keluarga")).toHaveValue(
    "Keluarga Budi & Sari Bahagia",
  );
  await page
    .getByRole("button", { name: "Buat Kode Baru", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Buat Kode Baru", exact: true })
    .click();
  await expect(page.getByText("DUIT-XY7A", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Hapus anggota Sari Wulandari" })
    .click();
  await page
    .getByRole("button", { name: "Keluarkan Anggota", exact: true })
    .click();
  await expect(page.getByText("1 / 2 anggota")).toBeVisible();
  await page.getByRole("button", { name: "Pulihkan Anggota Demo" }).click();
  await expect(page.getByText("2 / 2 anggota")).toBeVisible();
  await page.getByRole("link", { name: "Kelola Profil Saya" }).click();
  await page.getByLabel("Nama lengkap").fill("Budi Santoso Pratama");
  await page
    .getByRole("button", { name: "Simpan Profil", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Budi Santoso Pratama" }),
  ).toBeVisible();
});

test("penghapusan kategori memindahkan transaksi; struk tidak valid ditolak", async ({
  page,
}) => {
  await page.goto("/kategori");
  await page
    .getByRole("button", { name: "Hapus kategori Makan & Minum", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Hapus Kategori", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Transaksi", exact: true })
    .first()
    .click();
  await page.getByLabel("Cari transaksi").fill("Sate Padang");
  await expect(
    page.getByRole("cell", { name: "Lainnya", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Catat Transaksi", exact: true })
    .first()
    .click();
  await page.getByLabel("Pilih foto struk").setInputFiles({
    name: "bukan-gambar.png",
    mimeType: "image/png",
    buffer: Buffer.from("contoh teks, bukan PNG"),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "Isi file tidak sesuai format" }),
  ).toBeVisible();
});

test("semua halaman tersedia, tanpa galat browser atau luapan horizontal", async ({
  page,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const routes = [
    "/",
    "/fitur",
    "/tentang",
    "/kontak",
    "/masuk",
    "/daftar",
    "/lupa-kata-sandi",
    "/pengaturan-awal",
    "/undang/DUIT-XY7A",
    "/dashboard",
    "/transaksi",
    "/transaksi/baru",
    "/transaksi/trx-010",
    "/dompet",
    "/kategori",
    "/tabungan",
    "/tabungan/rumah-impian",
    "/laporan",
    "/riwayat-aktivitas",
    "/pengaturan",
    "/profil",
    "/pemilik/dashboard",
    "/pemilik/anggota",
  ];
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Dalam pengembangan");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      route,
    ).toBeTruthy();
  }
  expect(errors).toEqual([]);
});

test("catat, ubah, hapus transaksi memperbarui saldo dan riwayat sesi", async ({
  page,
}) => {
  await page.goto("/transaksi/baru");
  await page.getByLabel("Nominal transaksi").fill("125000");
  await page.getByLabel("Kategori", { exact: true }).selectOption("belanja");
  await page
    .getByLabel("Catatan transaksi")
    .fill("Belanja buah untuk keluarga");
  await page
    .getByRole("button", { name: "Simpan Transaksi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Belanja buah untuk keluarga" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ubah", exact: true }).click();
  await page.getByLabel("Nominal transaksi").fill("100000");
  await page
    .getByRole("button", { name: "Simpan Perubahan", exact: true })
    .click();
  await expect(page.getByText(/Rp\s?100\.000/).first()).toBeVisible();
  await page.getByRole("button", { name: "Hapus", exact: true }).click();
  await page.getByRole("button", { name: "Ya, Hapus Transaksi" }).click();
  await expect(page).toHaveURL(/\/transaksi$/);
  await page
    .getByRole("link", { name: "Riwayat Aktivitas", exact: true })
    .click();
  await expect(
    page.getByText("Menghapus Belanja buah untuk keluarga"),
  ).toBeVisible();
  await page.getByRole("link", { name: "Dompet", exact: true }).first().click();
  await expect(page.getByText(/Rp\s?14\.352\.500/)).toBeVisible();
});

test("transfer wajib berbeda dompet dan contoh OCR dapat diisikan", async ({
  page,
}) => {
  await page.goto("/transaksi/baru");
  await page.getByRole("tab", { name: "Transfer", exact: true }).click();
  await expect(
    page.getByLabel("Dompet tujuan").locator('option[value="rumah"]'),
  ).toHaveCount(0);
  await page.getByLabel("Nominal transaksi").fill("150000");
  await page.getByLabel("Dompet tujuan").selectOption("darurat");
  await page
    .getByRole("button", { name: "Simpan Transaksi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Transfer antar dompet" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Catat Transaksi", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Tampilkan Contoh Hasil OCR" })
    .click();
  await page.getByRole("button", { name: "Gunakan Contoh" }).click();
  await expect(page.getByLabel("Nominal transaksi")).toHaveValue("87.500");
  await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue(
    "makan",
  );
  await page
    .getByRole("button", { name: "Simpan Transaksi", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Struk Makan malam di Sate Padang Ajo" }),
  ).toBeVisible();
});

test("kategori, dompet, dan transfer tabungan dapat dikelola dalam sesi", async ({
  page,
}) => {
  await page.goto("/dompet");
  await page.getByRole("button", { name: "Tambah Dompet" }).click();
  await page.getByLabel("Nama dompet").fill("Dana Renovasi");
  await page.getByRole("button", { name: "Simpan Dompet" }).click();
  await expect(
    page.getByRole("heading", { name: "Dana Renovasi" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hapus Dana Renovasi", exact: true })
    .click();
  await page.getByRole("button", { name: "Hapus Dompet", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dana Renovasi" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Kategori", exact: true }).click();
  await page.getByRole("button", { name: "Tambah Kategori" }).click();
  await page.getByLabel("Nama kategori").fill("Perawatan Rumah");
  await page.getByRole("button", { name: "Simpan Kategori" }).click();
  await expect(
    page.getByRole("heading", { name: "Perawatan Rumah" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Target Tabungan", exact: true })
    .click();
  await page
    .getByRole("link", { name: "DP Rumah Impian", exact: true })
    .click();
  const goalUrl = page.url();
  await page
    .getByRole("link", { name: "Transfer ke Tabungan", exact: true })
    .click();
  await expect(page.getByLabel("Dompet sumber", { exact: true })).toHaveValue(
    "rumah",
  );
  await page.getByLabel("Nominal transaksi").fill("500000");
  await page
    .getByRole("button", { name: "Simpan Transaksi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Transfer antar dompet", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Target Tabungan", exact: true })
    .click();
  await page.getByRole("button", { name: "Semua", exact: true }).click();
  await page
    .locator('a[href="' + new URL(goalUrl).pathname + '"]')
    .first()
    .click();
  await expect(page.getByText(/Rp\s?43\.000\.000/)).toBeVisible();
  await page.getByRole("link", { name: "Dompet", exact: true }).first().click();
  await expect(page.getByText(/Rp\s?13\.852\.500/)).toBeVisible();
});

test("demo anggota melihat semua dompet dengan transaksi utama dan batas halaman pemilik", async ({
  page,
}) => {
  await page.goto("/dompet");
  await expect(
    page.getByRole("heading", { name: "Dompet Kendaraan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Dompet Liburan" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Budi Pemilik keluarga/ }).click();
  await page.getByRole("menuitem", { name: "Lihat sebagai Sari" }).click();
  await expect(
    page.getByRole("heading", { name: "Dompet Liburan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Dompet Kendaraan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Pengaturan", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /Sari Anggota keluarga/ }).click();
  await page.getByRole("menuitem", { name: "Lihat sebagai Budi" }).click();
  await page.getByRole("link", { name: "Pengaturan", exact: true }).click();
  await page.getByRole("button", { name: /Budi Pemilik keluarga/ }).click();
  await page.getByRole("menuitem", { name: "Lihat sebagai Sari" }).click();
  await expect(
    page.getByRole("heading", { name: "Ruang khusus pemilik keluarga" }),
  ).toBeVisible();
});

test("laporan, pencarian, dan validasi registrasi berfungsi", async ({
  page,
}) => {
  await page.goto("/transaksi");
  await page.getByLabel("Cari transaksi").fill("Sate Padang");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("link", { name: "Laporan", exact: true }).click();
  await page.getByRole("button", { name: "Harian", exact: true }).click();
  await expect(page.getByLabel("Dari tanggal")).toHaveValue("2026-09-30");
  await expect(
    page.getByRole("button", { name: "PDF", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Per Anggota", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Sari Wulandari", exact: true }),
  ).toBeVisible();
  await page.goto("/daftar");
  await page.getByLabel("Nama lengkap").fill("Budi Santoso");
  await page.getByLabel("Alamat email").fill("budi@example.com");
  await page.getByLabel("Kata sandi", { exact: true }).fill("contoh123");
  await page
    .getByLabel("Konfirmasi kata sandi", { exact: true })
    .fill("contoh456");
  await page.getByRole("button", { name: "Buat Akun Demo" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "belum sama" }),
  ).toBeVisible();
});

test("tampilan mobile, dark mode, dan screenshot hasil", async ({ page }) => {
  test.setTimeout(240000);
  fs.mkdirSync("docs/screenshots", { recursive: true });
  await page.goto("/");
  await page.screenshot({
    path: "docs/screenshots/landing-desktop.png",
    fullPage: true,
  });
  await page.goto("/dashboard");
  await page
    .getByRole("heading", { name: "Ke mana uang kita?" })
    .scrollIntoViewIfNeeded();
  await expect(page.locator(".recharts-sector").first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "docs/screenshots/dashboard-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Pilih tema tampilan" })
    .click();
  await page.getByRole("menuitemradio", { name: "Gelap", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({
    path: "docs/screenshots/dashboard-dark.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Pilih tema tampilan" })
    .click();
  await page.getByRole("menuitemradio", { name: "Terang", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/dashboard",
    "/transaksi",
    "/transaksi/baru",
    "/dompet",
    "/kategori",
    "/tabungan",
    "/tabungan/rumah-impian",
    "/laporan",
    "/pengaturan",
    "/profil",
    "/pemilik/anggota",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      route,
    ).toBeTruthy();
    if (route === "/dashboard" || route === "/") {
      if (route === "/dashboard") {
        await page
          .getByRole("heading", { name: "Ke mana uang kita?" })
          .scrollIntoViewIfNeeded();
        await expect(page.locator(".recharts-sector").first()).toBeVisible();
        await page.evaluate(() => window.scrollTo(0, 0));
      }
      await page.screenshot({
        path: `docs/screenshots/${route === "/" ? "landing" : "dashboard"}-mobile.png`,
        fullPage: true,
      });
    }
  }
  await page.getByRole("button", { name: "Buka menu navigasi" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Laporan", exact: true })
    .click();
  await expect(page).toHaveURL(/\/laporan$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});


