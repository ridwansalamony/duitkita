import { test, expect } from "@playwright/test";
test("form menolak transfer dompet kosong tanpa menyimpan transaksi", async ({
  page,
}) => {
  await page.goto("/dompet");
  await page
    .getByRole("button", { name: "Tambah Dompet", exact: true })
    .click();
  await page.getByLabel("Nama dompet").fill("Dompet Saldo Nol");
  await page
    .getByRole("button", { name: "Simpan Dompet", exact: true })
    .click();
  const card = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Dompet Saldo Nol", exact: true }),
  });
  await expect(card).toContainText(/Rp\s?0/);
  await page
    .getByRole("link", { name: "Catat Transaksi", exact: true })
    .first()
    .click();
  await page.getByRole("tab", { name: "Transfer", exact: true }).click();
  await page
    .getByLabel("Dompet sumber", { exact: true })
    .selectOption({ label: "Dompet Saldo Nol" });
  await page.getByLabel("Dompet tujuan", { exact: true }).selectOption("rumah");
  await page.getByLabel("Nominal transaksi").fill("200000");
  await expect(page.getByLabel("Catatan transaksi")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Simpan Transaksi", exact: true })
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Saldo Dompet Saldo Nol belum mencukupi" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/transaksi\/baru$/);
  await expect(page.getByLabel("Nominal transaksi")).toHaveValue("200.000");
  await page.screenshot({
    path: "docs/screenshots/fase-2-saldo-tidak-cukup.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Dompet", exact: true }).first().click();
  await expect(card).toContainText(/Rp\s?0/);
  await page
    .getByRole("link", { name: "Transaksi", exact: true })
    .first()
    .click();
  await page.getByLabel("Cari transaksi").fill("Transfer antar dompet");
  await expect(
    page.getByRole("cell", { name: "Transfer antar dompet", exact: true }),
  ).toHaveCount(0);
});
