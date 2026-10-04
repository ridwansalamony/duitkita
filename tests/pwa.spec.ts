import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("manifest, installation prompt and dismissal", async ({
  page,
  request,
}) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  const data = await manifest.json();
  expect(data.start_url).toBe("/dashboard");
  expect(data.display).toBe("standalone");
  for (const icon of data.icons) {
    const response = await request.get(icon.src);
    expect(response.headers()["content-type"]).toContain("image/png");
  }
  await page.goto("/masuk");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, { prompt: async () => ({ outcome: "accepted" }) });
    window.dispatchEvent(event);
  });
  await page
    .getByRole("button", { name: "Instal DuitKita", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Instal aplikasi DuitKita" }),
  ).toBeHidden();
});

test("offline navigation has no cached family data and recovers", async ({
  page,
  context,
}) => {
  await page.goto("/masuk");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Koneksi sedang terputus" }),
  ).toBeVisible();
  expect(await page.evaluate(() => caches.keys())).toEqual([]);
  await context.setOffline(false);
  await page.getByRole("link", { name: "Coba lagi" }).click();
  await expect(
    page.getByRole("heading", { name: "Koneksi sedang terputus" }),
  ).toBeHidden();
});

test("iPhone guidance can be dismissed for the session", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();
  await page.goto(
    `${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/masuk`,
  );
  await expect(
    page.getByText("Di Safari, buka menu", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tutup ajakan instal" }).click();
  await page.reload();
  await expect(
    page.getByRole("complementary", { name: "Instal aplikasi DuitKita" }),
  ).toBeHidden();
  await context.close();
});

test("Android shows manual guidance until the browser provides installation", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  });
  const page = await context.newPage();
  await page.goto(
    `${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/masuk`,
  );
  await expect(
    page.getByText("Buka DuitKita di Chrome", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Instal DuitKita", exact: true }),
  ).toBeHidden();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, { prompt: async () => ({ outcome: "dismissed" }) });
    window.dispatchEvent(event);
  });
  await page
    .getByRole("button", { name: "Instal DuitKita", exact: true })
    .click();
  await expect(
    page.getByText("Buka DuitKita di Chrome", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tutup ajakan instal" }).click();
  await page.reload();
  await expect(
    page.getByRole("complementary", { name: "Instal aplikasi DuitKita" }),
  ).toBeHidden();
  await context.close();
});
