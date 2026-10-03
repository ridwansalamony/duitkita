import { test, expect } from "@playwright/test";
test.skip(
  process.env.E2E_LIVE !== "1",
  "Dijalankan pada server mode live setelah build.",
);
test("mode live melindungi halaman keluarga dan tidak menawarkan pergantian akun demo", async ({
  page,
}) => {
  for (const path of [
    "/dashboard",
    "/transaksi",
    "/dompet",
    "/kategori",
    "/tabungan",
    "/laporan",
    "/riwayat-aktivitas",
    "/pengaturan",
    "/profil",
    "/pemilik/dashboard",
    "/pengaturan-awal",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/masuk\?/);
    await expect(
      page.getByRole("heading", { name: "Senang Anda kembali." }),
    ).toBeVisible();
  }
  await expect(page.getByText("Langsung jelajahi demo")).toHaveCount(0);
  await page.screenshot({
    path: "docs/screenshots/fase-2-masuk.png",
    fullPage: true,
  });
});
test("API struk menolak origin asing dan pengguna tanpa sesi", async ({
  request,
  baseURL,
}) => {
  const foreign = await request.post("/api/ocr/pratinjau", {
    headers: { origin: "https://contoh.invalid" },
    data: "data",
  });
  expect(foreign.status()).toBe(403);
  const anonymous = await request.post("/api/ocr/pratinjau", {
    headers: { origin: new URL(baseURL!).origin },
    data: "data",
  });
  expect(anonymous.status()).toBe(401);
});
test("tautan verifikasi tidak menjadi pengalihan ke situs asing", async ({
  page,
}) => {
  await page.goto("/autentikasi/konfirmasi?next=https://contoh.invalid");
  await expect(page).toHaveURL(/\/masuk\?pesan=tautan-kedaluwarsa/);
});

test("snapshot keluarga menolak sesi anonim dan tidak dapat di-cache", async ({
  request,
}) => {
  const response = await request.get("/api/ruang-keluarga");
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const body = await response.json();
  expect(body.success).toBe(false);
  expect(body).not.toHaveProperty("data");
});
