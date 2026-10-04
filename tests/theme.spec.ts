import { test, expect } from "@playwright/test";
import { build } from "esbuild";

test("tema perangkat dapat dipulihkan dari pilihan manual dan mengikuti perubahan sistem", async ({
  page,
}) => {
  const result = await build({
    entryPoints: ["tests/fixtures/theme-harness.tsx"],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"test"' },
  });
  await page.route("https://tema.local/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<div id="root"></div><script src="/test.js"></script>',
    }),
  );
  await page.route("https://tema.local/test.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: result.outputFiles[0].text,
    }),
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("https://tema.local/");
  await expect(page.locator("html")).toHaveClass("dark");
  await page.getByRole("button", { name: "Pilih tema tampilan" }).click();
  await page
    .getByRole("menuitemradio", { name: "Terang", exact: true })
    .click();
  await expect(page.locator("html")).toHaveClass("light");
  await page.reload();
  await expect(page.locator("html")).toHaveClass("light");
  await page.getByRole("button", { name: "Pilih tema tampilan" }).click();
  await page.getByRole("menuitemradio", { name: "Ikuti perangkat" }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass("light");
  await page.reload();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass("dark");
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(
    "system",
  );
});
