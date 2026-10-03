import { test, expect } from "@playwright/test";

test.describe("HTTP production", () => {
  test.skip(process.env.E2E_LIVE_HTTP !== "1", "Memerlukan server build live");
  test("laporan dan data keluarga menolak pengguna anonim", async ({
    request,
  }) => {
    for (const path of [
      "/api/laporan?start=2026-10-01&end=2026-10-31",
      "/api/ruang-keluarga",
    ]) {
      const response = await request.get(path);
      expect(response.status()).toBe(401);
    }
  });
  test("SEO publik dan header keamanan tersedia", async ({ request }) => {
    const home = await request.get("/");
    expect(home.ok()).toBe(true);
    expect(home.headers()["x-content-type-options"]).toBe("nosniff");
    expect(home.headers()["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(await home.text()).toContain('"@type":"SoftwareApplication"');
    const sitemap = await request.get("/sitemap.xml");
    expect(await sitemap.text()).toContain("/fitur</loc>");
    expect(await sitemap.text()).not.toContain("/transaksi");
    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toContain("Disallow: /api/");
    const image = await request.get("/opengraph-image");
    expect(image.ok()).toBe(true);
    expect(image.headers()["content-type"]).toContain("image/png");
    const login = await request.get("/masuk");
    expect(await login.text()).toContain('content="noindex, nofollow"');
  });
});
