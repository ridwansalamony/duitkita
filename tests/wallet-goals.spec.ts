import { test, expect } from "@playwright/test";

test("saldo target mengikuti transfer, perubahan dan hapus tanpa kontribusi manual", async ({
  page,
}) => {
  await page.goto("/tabungan/liburan-bali");
  const balance = page.locator("main section").first();
  await expect(balance).toContainText(/Rp\s?9\.750\.000/);
  await expect(page.getByRole("button", { name: /Kontribusi/ })).toHaveCount(0);
  await page.screenshot({
    path: "docs/screenshots/fase-2-target-dompet.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Transfer ke Tabungan", exact: true })
    .click();
  await expect(
    page.getByRole("tab", { name: "Transfer", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel("Dompet sumber", { exact: true })).toHaveValue(
    "rumah",
  );
  await expect(page.getByLabel("Dompet tujuan", { exact: true })).toHaveValue(
    "sari-wallet",
  );
  await page.getByLabel("Nominal transaksi").fill("1250000");
  await expect(page.getByLabel("Catatan transaksi")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Simpan Transaksi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Transfer antar dompet" }),
  ).toBeVisible();
  const returnToGoal = async () => {
    await page
      .getByRole("link", { name: "Target Tabungan", exact: true })
      .click();
    await page
      .getByRole("link", { name: "Liburan ke Bali", exact: true })
      .click();
  };
  await returnToGoal();
  await expect(balance).toContainText(/Rp\s?11\.000\.000/);
  await page.getByRole("link", { name: /Transfer antar dompet/ }).click();
  await expect(
    page.getByRole("heading", { name: "Cerita di balik catatan", level: 1 }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ubah", exact: true }).click();
  await page.getByLabel("Nominal transaksi").fill("2250000");
  await page
    .getByRole("button", { name: "Simpan Perubahan", exact: true })
    .click();
  await returnToGoal();
  await expect(balance).toContainText(/Rp\s?12\.000\.000/);
  await page.getByRole("link", { name: /Transfer antar dompet/ }).click();
  await expect(
    page.getByRole("heading", { name: "Cerita di balik catatan", level: 1 }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hapus", exact: true }).click();
  await page.getByRole("button", { name: "Ya, Hapus Transaksi" }).click();
  await returnToGoal();
  await expect(balance).toContainText(/Rp\s?9\.750\.000/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("h1")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    )
    .toBeTruthy();
  await page.screenshot({
    path: "docs/screenshots/fase-2-target-dompet-mobile.png",
    fullPage: true,
  });
});

test("detail tabungan tetap muat pada layar sempit dan nama dompet panjang", async ({
  page,
}) => {
  await page.goto("/tabungan/liburan-bali");
  await expect(
    page.getByRole("heading", { name: "Liburan ke Bali", exact: true }),
  ).toBeVisible();
  // Stress content sizing without changing stored family data.
  await page
    .locator("main section")
    .nth(1)
    .locator("p")
    .first()
    .evaluate((element) => {
      element.textContent = "TabunganLiburanKeluargaBudiDanSariBersamaAnakAnak";
    });
  for (const width of [320, 360, 390, 768, 1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(() => ({
          viewport: innerWidth,
          overflow: document.documentElement.scrollWidth - innerWidth,
        })),
      )
      .toEqual({ viewport: width, overflow: 0 });
    await expect(
      page.getByRole("link", { name: "Transfer ke Tabungan", exact: true }),
    ).toBeVisible();
  }
});

test("target mewajibkan dompet unik dan kedua pengguna memakai dompet utama", async ({
  page,
}) => {
  await page.goto("/tabungan");
  await page.getByRole("button", { name: "Buat Target", exact: true }).click();
  await page.getByLabel("Nama target").fill("Membeli Mobil");
  await page.getByLabel("Target tabungan (Rp)").fill("200000000");
  await page
    .getByRole("button", { name: "Simpan Target", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const selector = page.getByRole("combobox", {
    name: "Dompet tabungan",
    exact: true,
  });
  expect(
    await selector.evaluate(
      (el: HTMLSelectElement) => el.validity.valueMissing,
    ),
  ).toBeTruthy();
  await expect(selector.locator('option[value="sari-wallet"]')).toHaveCount(0);
  await selector.selectOption("budi-wallet");
  await page.screenshot({
    path: "docs/screenshots/fase-2-pilih-dompet-target.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Simpan Target", exact: true })
    .click();
  await page.getByRole("link", { name: "Membeli Mobil", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Membeli Mobil", level: 1 }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Catat Transaksi", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Dompet sumber", { exact: true })).toHaveValue(
    "rumah",
  );
  await page.getByRole("link", { name: "Dompet", exact: true }).first().click();
  await expect(
    page.getByRole("button", { name: "Hapus Dompet Keluarga", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Budi Pemilik keluarga/ }).click();
  await page.getByRole("menuitem", { name: "Lihat sebagai Sari" }).click();
  await expect(
    page.getByRole("heading", { name: "Dompet Kendaraan", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tambah Dompet", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("link", { name: "Catat Transaksi", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Dompet sumber", { exact: true })).toHaveValue(
    "rumah",
  );
});
