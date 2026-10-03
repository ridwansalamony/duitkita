import { test, expect } from "@playwright/test";

test("form sesuai jenis, nominal berformat, transaksi pada tanggal sama tampil terbaru dahulu", async ({
  page,
}) => {
  await page.goto("/transaksi/baru");
  await expect(page.getByLabel("Pilih foto struk")).toHaveCount(1);
  const amount = page.getByLabel("Nominal transaksi");
  await amount.fill("20000000");
  await expect(amount).toHaveValue("20.000.000");
  await amount.press("Home");
  await amount.press("ArrowRight");
  await amount.press("ArrowRight");
  await amount.press("ArrowRight");
  await amount.press("Backspace");
  await expect(amount).toHaveValue("2.000.000");
  await amount.fill("Rp20.000,25");
  await expect(amount).toHaveValue("20.000,25");
  await page.getByRole("tab", { name: "Pemasukan", exact: true }).click();
  await expect(page.getByLabel("Pilih foto struk")).toHaveCount(0);
  await expect(
    page.getByText("Baca struk otomatis", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Catatan transaksi")).toBeVisible();
  await page.getByLabel("Kategori", { exact: true }).selectOption("gaji");
  await page.getByLabel("Catatan transaksi").fill("Pemasukan pertama hari ini");
  await page
    .getByRole("button", { name: "Simpan Transaksi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pemasukan pertama hari ini" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bukti struk" })).toHaveCount(
    0,
  );
  await page
    .getByRole("link", { name: "Catat Transaksi", exact: true })
    .first()
    .click();
  await page.getByRole("tab", { name: "Pemasukan", exact: true }).click();
  await amount.fill("12345,67");
  await page.getByLabel("Kategori", { exact: true }).selectOption("gaji");
  await page.getByLabel("Catatan transaksi").fill("Pemasukan kedua hari ini");
  await page
    .getByRole("button", { name: "Simpan Transaksi", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Semua transaksi", exact: true })
    .click();
  await expect(page.locator("tbody tr").first()).toContainText(
    "Pemasukan kedua hari ini",
  );
  await expect(page.locator("tbody tr").nth(1)).toContainText(
    "Pemasukan pertama hari ini",
  );
  await page
    .getByRole("link", { name: "Catat Transaksi", exact: true })
    .first()
    .click();
  await page.getByRole("tab", { name: "Transfer", exact: true }).click();
  await expect(page.getByLabel("Catatan transaksi")).toHaveCount(0);
  await expect(page.getByLabel("Pilih foto struk")).toHaveCount(0);
  await amount.fill("200000");
  await page
    .getByLabel("Dompet tujuan", { exact: true })
    .selectOption("sari-wallet");
  await page.screenshot({
    path: "docs/screenshots/fase-2-form-transfer-ringkas.png",
    fullPage: true,
  });
});

test("budget kategori mengikuti tambah, ubah, hapus dan bulan transaksi", async ({
  page,
}) => {
  await page.goto("/kategori");
  await page
    .getByRole("button", { name: "Tambah Kategori", exact: true })
    .click();
  await page
    .getByLabel("Nama kategori", { exact: true })
    .fill("Bekal Keluarga");
  await page
    .getByLabel("Maksimal budget bulanan (Rp)", { exact: false })
    .fill("2000000");
  await expect(
    page.getByLabel("Maksimal budget bulanan (Rp)", { exact: false }),
  ).toHaveValue("2.000.000");
  await page
    .getByRole("button", { name: "Simpan Kategori", exact: true })
    .click();
  const card = page.locator("div.rounded-xl.border.p-4").filter({
    has: page.getByRole("heading", { name: "Bekal Keluarga", exact: true }),
  });
  await expect(card).toContainText("0% terpakai");
  const returnToCategories = async () =>
    page.getByRole("link", { name: "Kategori", exact: true }).first().click();
  await page
    .getByRole("link", { name: "Catat Transaksi", exact: true })
    .first()
    .click();
  await page.getByLabel("Nominal transaksi").fill("1700000");
  await page
    .getByLabel("Kategori", { exact: true })
    .selectOption({ label: "Bekal Keluarga" });
  await page.getByLabel("Catatan transaksi").fill("Bekal untuk keluarga");
  await expect(page.getByTestId("budget-progress")).toContainText(
    "85% terpakai",
  );
  await expect(page.getByTestId("budget-progress")).toContainText(
    "Mendekati batas",
  );
  await page
    .getByRole("button", { name: "Simpan Transaksi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Bekal untuk keluarga", exact: true }),
  ).toBeVisible();
  const txPath = new URL(page.url()).pathname;
  await returnToCategories();
  await expect(card).toContainText("85% terpakai");
  await page.getByLabel("Bulan pemakaian").fill("2026-08");
  await expect(card).toContainText("0% terpakai");
  await page.getByLabel("Bulan pemakaian").fill("2026-09");
  await expect(card).toContainText("85% terpakai");
  const returnToTransaction = async () => {
    await page
      .getByRole("link", { name: "Transaksi", exact: true })
      .first()
      .click();
    await page.locator(`a[href="${txPath}"]`).first().click();
  };
  await returnToTransaction();
  await page.getByRole("button", { name: "Ubah", exact: true }).click();
  await expect(page.getByTestId("budget-progress")).toContainText(
    "85% terpakai",
  );
  await page.getByLabel("Nominal transaksi").fill("2200000");
  await expect(page.getByTestId("budget-progress")).toContainText(
    "110% terpakai",
  );
  await page
    .getByRole("button", { name: "Simpan Perubahan", exact: true })
    .click();
  await returnToCategories();
  await expect(card).toContainText(/Melebihi budget Rp\s?200\.000/);
  await page.screenshot({
    path: "docs/screenshots/fase-2-budget-kategori.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "docs/screenshots/fase-2-budget-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await returnToTransaction();
  await page.getByRole("button", { name: "Hapus", exact: true }).click();
  await page
    .getByRole("button", { name: "Ya, Hapus Transaksi", exact: true })
    .click();
  await returnToCategories();
  await expect(card).toContainText("0% terpakai");
  await page
    .getByRole("button", { name: "Ubah kategori Bekal Keluarga", exact: true })
    .click();
  await page
    .getByLabel("Maksimal budget bulanan (Rp)", { exact: false })
    .fill("");
  await page
    .getByRole("button", { name: "Simpan Kategori", exact: true })
    .click();
  await expect(card).toContainText("Belum ada batas budget");
});
