import { test, expect, type Page } from "@playwright/test";

test.skip(
  process.env.E2E_OCR !== "1",
  "Memerlukan server demo untuk menguji worker OCR di browser.",
);

async function receipt(page: Page, blank = false) {
  return Buffer.from(
    await page.evaluate((blank) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 900;
      const context = canvas.getContext("2d")!;
      context.fillStyle = "white";
      context.fillRect(0, 0, 1000, 900);
      context.fillStyle = "black";
      context.font = "32px monospace";
      if (!blank)
        [
          "SATE PADANG AJO",
          "Jl. Melati 12",
          "30/09/2026",
          "",
          "Sate Padang      75.000",
          "Teh hangat      12.500",
          "",
          "TOTAL Rp 87.500",
          "TUNAI Rp 100.000",
          "KEMBALI Rp 12.500",
          "",
          "Terima kasih",
        ].forEach((line, i) => context.fillText(line, 70, 70 + i * 60));
      return canvas.toDataURL("image/png").split(",")[1];
    }, blank),
    "base64",
  );
}

test("worker nyata membaca struk lokal, saran diperiksa sebelum diterapkan", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/transaksi/baru");
  const external: string[] = [];
  page.on("request", (request) => {
    if (
      /https?:/.test(request.url()) &&
      new URL(request.url()).origin !== new URL(page.url()).origin
    )
      external.push(request.url());
  });

  await page.getByLabel("Nominal transaksi").fill("5000");
  await page.getByLabel("Pilih foto struk").setInputFiles({
    name: "struk-budi-sari.png",
    mimeType: "image/png",
    buffer: await receipt(page),
  });
  await expect(
    page.getByText("Saran dari foto struk", { exact: true }),
  ).toBeVisible({ timeout: 70000 });
  await expect(page.getByLabel("Nominal transaksi")).toHaveValue("5.000");
  await page
    .getByRole("button", { name: "Gunakan Saran", exact: true })
    .click();
  await expect(page.getByLabel("Nominal transaksi")).toHaveValue("87.500");
  await expect(page.getByLabel("Tanggal", { exact: true })).toHaveValue(
    "2026-09-30",
  );
  await expect(page.getByLabel("Catatan transaksi")).toHaveValue(
    "SATE PADANG AJO",
  );
  expect(external).toEqual([]);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({
    path: "docs/screenshots/fase-2-ocr-tesseract.png",
    fullPage: true,
  });
});

test("gambar kosong tidak mengarang isian dan tetap dapat disimpan manual", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/transaksi/baru");
  await page.getByLabel("Nominal transaksi").fill("42000");
  await page.getByLabel("Pilih foto struk").setInputFiles({
    name: "struk-kosong.png",
    mimeType: "image/png",
    buffer: await receipt(page, true),
  });
  await expect(
    page.getByText("Tulisan belum terbaca dengan jelas.", { exact: false }),
  ).toBeVisible({ timeout: 70000 });
  await expect(page.getByLabel("Nominal transaksi")).toHaveValue("42.000");
  await expect(
    page.getByRole("img", { name: "Pratinjau lampiran struk" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Simpan Transaksi", exact: true }),
  ).toBeEnabled();
});

test("gagal memuat worker tetap mempertahankan foto dan isian", async ({
  page,
}) => {
  await page.route("**/ocr/worker.min.js", (route) => route.abort());
  await page.goto("/transaksi/baru");
  await page.getByLabel("Nominal transaksi").fill("45000");
  await page.getByLabel("Pilih foto struk").setInputFiles({
    name: "struk.png",
    mimeType: "image/png",
    buffer: await receipt(page),
  });
  await expect(
    page.getByText("Pembacaan otomatis belum berhasil.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel("Nominal transaksi")).toHaveValue("45.000");
  await expect(
    page.getByRole("button", { name: "Simpan Transaksi", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("img", { name: "Pratinjau lampiran struk" }),
  ).toBeVisible();
});

test("pembacaan dapat dihentikan tanpa menghapus lampiran", async ({
  page,
}) => {
  await page.route("**/ocr/worker.min.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.goto("/transaksi/baru");
  await page.getByLabel("Pilih foto struk").setInputFiles({
    name: "struk.png",
    mimeType: "image/png",
    buffer: await receipt(page),
  });
  await page.getByRole("button", { name: "Hentikan pembacaan" }).click();
  await expect(
    page.getByText("Pembacaan dihentikan.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Simpan Transaksi", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("img", { name: "Pratinjau lampiran struk" }),
  ).toBeVisible();
});

test("berganti jenis membatalkan OCR dan mengosongkan lampiran tersembunyi", async ({
  page,
}) => {
  let release: () => void = () => {};
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/ocr/worker.min.js", async (route) => {
    await hold;
    await route.abort().catch(() => {});
  });
  await page.goto("/transaksi/baru");
  await page.getByLabel("Pilih foto struk").setInputFiles({
    name: "struk.png",
    mimeType: "image/png",
    buffer: await receipt(page),
  });
  await expect(
    page.getByRole("button", { name: "Hentikan pembacaan" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Transfer", exact: true }).click();
  await expect(page.getByLabel("Catatan transaksi")).toHaveCount(0);
  await expect(page.getByLabel("Pilih foto struk")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Simpan Transaksi", exact: true }),
  ).toBeEnabled();
  release();
  await page.getByRole("tab", { name: "Pengeluaran", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Pratinjau lampiran struk" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Saran dari foto struk", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Pembacaan dihentikan.", { exact: false }),
  ).toHaveCount(0);
});
