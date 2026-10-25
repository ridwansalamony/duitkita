import { test, expect } from "@playwright/test";
const pages = [
  ["/", "Uang berdua. Cerita bersama. Lebih tenang."],
  ["/fitur", "Keuangan keluarga, terasa lebih sederhana."],
  ["/tentang", "Karena masa depan lebih indah direncanakan berdua."],
  ["/kontak", "Ada cerita atau ide untuk DuitKita?"],
] as const;
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme });
    for (const [route, heading] of pages) {
      test(
        route + " mempertahankan identitas dan muat di desktop/mobile",
        async ({ page }, info) => {
          await page.goto(route);
          await page.evaluate(() => document.fonts.ready);
          const h1 = page.getByRole("heading", { level: 1 });
          await expect
            .poll(async () =>
              (await h1.innerText()).replace(/\s+/g, " ").trim(),
            )
            .toBe(heading);
          await expect(page.locator("header nav a")).toHaveText([
            "Fitur",
            "Tentang Kami",
            "Kontak",
          ]);
          await expect(
            page.locator("header a[aria-label='DuitKita beranda']"),
          ).toHaveAttribute("href", "/");
          expect(await page.locator(".public-site").innerText()).not.toMatch(
            /[—–]/,
          );
          for (const width of [1440, 1024, 768, 390, 320]) {
            await page.setViewportSize({ width, height: 1000 });
            await expect
              .poll(() =>
                page.evaluate(
                  () => document.documentElement.scrollWidth - innerWidth,
                ),
              )
              .toBeLessThanOrEqual(1);
            if (width >= 1024) {
              expect(
                await page
                  .locator("header")
                  .evaluate((e) => e.getBoundingClientRect().height),
              ).toBeLessThanOrEqual(80);
              if (route === "/") {
                expect(
                  await h1.evaluate(
                    (e) =>
                      e.getBoundingClientRect().height /
                      parseFloat(getComputedStyle(e).lineHeight),
                  ),
                ).toBeLessThanOrEqual(2.05);
                expect(
                  await page
                    .locator("main section")
                    .first()
                    .evaluate((e) => e.getBoundingClientRect().bottom),
                ).toBeLessThanOrEqual(1000);
              }
            }
            for (const image of await page.locator("main img:visible").all()) {
              await image.scrollIntoViewIfNeeded();
              await expect
                .poll(() =>
                  image.evaluate(
                    (e: HTMLImageElement) => e.complete && e.naturalWidth > 0,
                  ),
                )
                .toBe(true);
            }
            await page.evaluate(() => window.scrollTo(0, 0));
          }
          await page
            .getByRole("button", { name: "Buka menu", exact: true })
            .click();
          const nav = page.getByRole("navigation", {
            name: "Navigasi utama mobile",
          });
          await expect(nav).toBeVisible();
          expect(
            await nav
              .locator("a")
              .evaluateAll((es) => es.map((e) => e.getAttribute("href"))),
          ).toEqual(["/fitur", "/tentang", "/kontak"]);
          await page
            .getByRole("button", { name: "Tutup menu", exact: true })
            .click();
          await expect(nav).toBeHidden();
          await page.screenshot({
            path: info.outputPath("mobile.png"),
            fullPage: true,
          });
          await page.setViewportSize({ width: 1440, height: 1000 });
          await page.screenshot({
            path: info.outputPath("desktop.png"),
            fullPage: true,
          });
        },
      );
    }
  });
}
test("form kontak dan anchor privasi tetap", async ({ page }) => {
  await page.goto("/kontak");
  expect(
    await page
      .locator("main form [name]")
      .evaluateAll((es) => es.map((e) => e.getAttribute("name"))),
  ).toEqual(["name", "email", "subject", "message"]);
  await page.goto("/tentang#privasi");
  await expect(page.locator("#privasi")).toBeVisible();
  await expect(page.locator("#privasi")).toContainText(
    "Versi demo memakai data contoh.",
  );
});

test("FAQ dan menu mobile dapat dioperasikan dengan keyboard", async ({
  page,
}) => {
  await page.goto("/");
  const question = page.getByRole("button", {
    name: "Apakah saya harus menghubungkan rekening bank?",
    exact: true,
  });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("data-state", "open");
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("data-state", "closed");
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole("button", { name: "Buka menu", exact: true });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(menu).toBeFocused();
});

test("gambar produk mengikuti pilihan tema manual", async ({ page }) => {
  await page.goto("/");
  for (const theme of ["Gelap", "Terang"]) {
    await page
      .getByRole("button", { name: "Pilih tema tampilan", exact: true })
      .click();
    await page.getByRole("menuitemradio", { name: theme, exact: true }).click();
    await expect
      .poll(() =>
        page
          .locator("main img")
          .first()
          .evaluate((e: HTMLImageElement) => e.currentSrc),
      )
      .toContain(theme === "Gelap" ? "gelap" : "terang");
  }
});

test("form kontak demo mempertahankan validasi dan alur kirim", async ({
  page,
}) => {
  await page.goto("/kontak");
  await page
    .getByRole("button", { name: "Coba Kirim Pesan", exact: true })
    .click();
  expect(
    await page
      .getByLabel("Nama Anda", { exact: true })
      .evaluate((e: HTMLInputElement) => e.validity.valueMissing),
  ).toBe(true);
  await page.getByLabel("Nama Anda", { exact: true }).fill("Budi Santoso");
  await page.getByLabel("Email", { exact: true }).fill("budi@contoh.com");
  await page
    .getByLabel("Pesan", { exact: true })
    .fill("Saya ingin memahami laporan keuangan bersama keluarga.");
  await page
    .getByRole("button", { name: "Coba Kirim Pesan", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Terima kasih sudah mencoba!",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Tulis pesan lain", exact: true })
    .click();
  await expect(page.getByLabel("Nama Anda", { exact: true })).toBeVisible();
});
