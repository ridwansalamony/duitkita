import { test, expect } from "@playwright/test";
import { build } from "esbuild";
let bundle: string;
test.beforeAll(async () => {
  const result = await build({
    entryPoints: ["tests/fixtures/logout-harness.tsx"],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    define: {
      "process.env.NODE_ENV": '"test"',
      "process.env.NEXT_PUBLIC_APP_MODE": '"live"',
    },
    plugins: [
      {
        name: "auth",
        setup(builder) {
          builder.onResolve({ filter: /^@\/actions\/auth$/ }, (args) => ({
            path: args.path,
            namespace: "fake",
          }));
          builder.onLoad({ filter: /.*/, namespace: "fake" }, () => ({
            contents:
              'export const logout = async () => { const response = await fetch("/logout-test", {method: "POST"}); return response.json(); };',
          }));
        },
      },
    ],
  });
  bundle = result.outputFiles[0].text;
});
for (const success of [true, false]) {
  test(`logout ${success ? "berhasil berpindah tanpa notifikasi gagal" : "gagal tetap di halaman dan dapat diulang"}`, async ({
    page,
  }) => {
    let calls = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("https://test.local/", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<div id="root"></div><script src="/test.js"></script>',
      }),
    );
    await page.route("**/test.js", (route) =>
      route.fulfill({ contentType: "text/javascript", body: bundle }),
    );
    await page.route("**/masuk", (route) =>
      route.fulfill({ contentType: "text/html", body: "<h1>Masuk</h1>" }),
    );
    await page.route("**/logout-test", async (route) => {
      calls++;
      await gate;
      await route.fulfill({ json: { success, error: "Gagal" } });
    });
    await page.goto("https://test.local/");
    await page.getByRole("button", { name: "Menu akun" }).click();
    await page.getByRole("menuitem", { name: "Keluar", exact: true }).click();
    await expect(
      page.getByRole("menuitem", { name: "Keluar…" }),
    ).toHaveAttribute("aria-disabled", "true");
    await page
      .getByRole("menuitem", { name: "Keluar…" })
      .dispatchEvent("click");
    expect(calls).toBe(1);
    release();
    if (success) {
      await expect(page).toHaveURL("https://test.local/masuk");
      await expect(
        page.getByText("Belum berhasil keluar. Coba kembali."),
      ).toHaveCount(0);
    } else {
      await expect(
        page.getByText("Belum berhasil keluar. Coba kembali."),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Keluar", exact: true }),
      ).not.toHaveAttribute("aria-disabled", "true");
      await expect(page).toHaveURL("https://test.local/");
    }
  });
}
