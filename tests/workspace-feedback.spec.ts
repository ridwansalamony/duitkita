import { test, expect, type Page } from "@playwright/test";
import { build } from "esbuild";
import { readFileSync, readdirSync } from "node:fs";
let bundle: string;
test.beforeAll(async () => {
  const result = await build({
    entryPoints: ["tests/fixtures/workspace-harness.tsx"],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    define: {
      "process.env": "{}",
      "process.env.NODE_ENV": '"test"',
      "process.env.NEXT_PUBLIC_APP_MODE": '"live"',
    },
    plugins: [
      {
        name: "transports",
        setup(builder) {
          builder.onResolve(
            {
              filter:
                /^(@\/actions\/finance|@supabase\/supabase-js|next\/link)$/,
            },
            (args) => ({ path: args.path, namespace: "fake" }),
          );
          builder.onLoad({ filter: /.*/, namespace: "fake" }, (args) => ({
            loader: "js",
            contents:
              args.path === "@/actions/finance"
                ? `export const mutate = () => window.harness.mutate(); export const realtimeToken = async () => "test";`
                : args.path === "next/link"
                  ? `export default "a";`
                  : `export function createClient() { const channel = { on(_type, _filter, callback) { window.harness.listen(callback); return channel; }, subscribe() { return channel; } }; return { realtime: { setAuth: async () => {} }, channel: () => channel, removeAllChannels: async () => {} }; }`,
          }));
        },
      },
    ],
  });
  bundle = result.outputFiles[0].text;
});
async function open(page: Page) {
  page.on("pageerror", (error) => console.error("Harness:", error.message));
  await page.route("https://test.local/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<div id="root"></div><script src="/test.js"></script>',
    }),
  );
  await page.route("https://test.local/test.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: bundle }),
  );
  await page.goto("https://test.local/");
}
async function fillGoal(page: Page, name: string) {
  await page.getByRole("button", { name: "Buat Target", exact: true }).click();
  await page.getByLabel("Nama target").fill(name);
  await page.getByLabel("Target tabungan (Rp)").fill("1000000");
  const choice = await page
    .getByRole("combobox", { name: "Dompet tabungan", exact: true })
    .locator("option:not([disabled])")
    .first()
    .getAttribute("value");
  await page
    .getByRole("combobox", { name: "Dompet tabungan", exact: true })
    .selectOption(choice!);
  await page
    .getByRole("button", { name: "Simpan Target", exact: true })
    .click();
}
test("sukses mengikuti commit, refresh lambat tidak menahan tombol atau mutasi berikutnya", async ({
  page,
}) => {
  let release: () => void = () => {};
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/ruang-keluarga", async (route) => {
    await hold;
    await route
      .fulfill({ json: await page.evaluate(() => window.harness.initial) })
      .catch(() => {});
  });
  await open(page);
  await fillGoal(page, "Liburan Budi dan Sari");
  await expect(
    page.getByRole("button", { name: "Memproses…", exact: true }),
  ).toBeDisabled();
  if (process.env.E2E_FEEDBACK_SCREENSHOT === "1") {
    await page.route("https://test.local/_next/**", (route) => route.abort());
    await page.addStyleTag({
      content: readdirSync(".next/static/css", { recursive: true })
        .filter((file) => String(file).endsWith(".css"))
        .map((file) => readFileSync(`.next/static/css/${file}`, "utf8"))
        .join("\n"),
    });
    await page.addStyleTag({
      content: "body { padding: 40px; font-family: Arial, sans-serif; }",
    });
    await page
      .getByRole("dialog")
      .screenshot({ path: "docs/screenshots/fase-2-proses-simpan.png" });
  }
  // Pengiriman ulang lewat Enter/requestSubmit juga dicegah sebelum render berikutnya.
  await page
    .locator('form[aria-busy="true"]')
    .evaluate((form: HTMLFormElement) => form.requestSubmit());
  expect(await page.evaluate(() => window.harness.calls)).toBe(1);
  await page.evaluate(() => window.harness.resolve(true));
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("Target tabungan disimpan", { exact: true }),
  ).toBeVisible();
  await fillGoal(page, "Dana Pendidikan Budi dan Sari");
  expect(await page.evaluate(() => window.harness.calls)).toBe(2);
  release(); // Respons lama tidak boleh menghapus perubahan optimistis yang lebih baru.
  await expect(page.getByTestId("goals")).toContainText(
    "Dana Pendidikan Budi dan Sari",
  );
  await page.evaluate(() => window.harness.resolve(false));
});
test("penolakan server mengembalikan data dan membuka kembali tombol tanpa sukses palsu", async ({
  page,
}) => {
  await page.route("**/api/ruang-keluarga", async (route) =>
    route.fulfill({ json: await page.evaluate(() => window.harness.initial) }),
  );
  await open(page);
  await fillGoal(page, "Target yang ditolak");
  await page.evaluate(() => window.harness.resolve(false));
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Simpan Target", exact: true }),
  ).toBeEnabled();
  await expect(page.getByTestId("goals")).not.toContainText(
    "Target yang ditolak",
  );
  await expect(
    page.getByText("Target tabungan disimpan", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Nama target")).toHaveValue(
    "Target yang ditolak",
  );
});
test("kegagalan sinkronisasi sesudah commit tidak membatalkan perubahan", async ({
  page,
}) => {
  await page.route("**/api/ruang-keluarga", (route) =>
    route.fulfill({ status: 503, json: { success: false } }),
  );
  await open(page);
  await fillGoal(page, "Target tersimpan");
  await page.evaluate(() => window.harness.resolve(true));
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByTestId("goals")).toContainText("Target tersimpan");
  await expect(
    page.getByText("Data terbaru belum tersinkron.", { exact: false }),
  ).toBeVisible();
});
test("tombol aksi async menampilkan proses dan mencegah klik ganda", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Hapus contoh", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Memproses…", exact: true }),
  ).toBeDisabled();
  expect(await page.evaluate(() => window.harness.calls)).toBe(1);
  await page.evaluate(() => window.harness.resolve(true));
  await expect(
    page.getByRole("button", { name: "Hapus contoh", exact: true }),
  ).toBeEnabled();
});
test("event audit Realtime memperbarui target tanpa reload halaman", async ({
  page,
}) => {
  await page.route("**/api/ruang-keluarga", async (route) => {
    const result = (await page.evaluate(() => window.harness.initial)) as {
      data: { goals: { name: string }[] };
    };
    result.data.goals[0].name = "Target diperbarui pasangan";
    await route.fulfill({ json: result });
  });
  await open(page);
  await page.evaluate(() => window.harness.emit());
  await expect(page.getByTestId("goals")).toContainText(
    "Target diperbarui pasangan",
  );
});
