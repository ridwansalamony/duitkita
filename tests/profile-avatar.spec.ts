import { test, expect } from "@playwright/test";

test("foto dan inisial profil sinkron pada navbar serta pencatat transaksi tanpa reload", async ({
  page,
}) => {
  await page.goto("/profil");
  await page.getByLabel("Nama lengkap").fill("Ridwan");
  await page
    .getByRole("button", { name: "Simpan Profil", exact: true })
    .click();
  const header = page.getByRole("banner");
  await expect(
    header.getByRole("button", {
      name: "R Ridwan Pemilik keluarga",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Transaksi", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("cell", { name: "R Ridwan", exact: true }).first(),
  ).toBeVisible();
  await header
    .getByRole("button", { name: "R Ridwan Pemilik keluarga", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Profil saya", exact: true })
    .click();
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#7c3aed";
    context.fillRect(0, 0, 96, 96);
    context.fillStyle = "white";
    context.font = "48px sans-serif";
    context.fillText("R", 30, 65);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page
    .getByLabel("Pilih foto profil")
    .setInputFiles({
      name: "ridwan.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    });
  await expect(
    page.getByText("Foto profil diperbarui", { exact: true }),
  ).toBeVisible();
  const profileImage = page
    .locator("main")
    .getByRole("img", { name: "Foto Ridwan", exact: true });
  const stored = await profileImage.getAttribute("src");
  await expect(
    header.getByRole("img", { name: "Foto Ridwan", exact: true }),
  ).toHaveAttribute("src", stored!);
  await page
    .getByRole("link", { name: "Transaksi", exact: true })
    .first()
    .click();
  const authorImage = page
    .locator("tbody tr")
    .filter({ hasText: "Ridwan" })
    .first()
    .getByRole("img", { name: "Foto Ridwan", exact: true });
  await expect(authorImage).toBeVisible();
  await expect(authorImage).toHaveAttribute("src", stored!);
  await expect
    .poll(() =>
      authorImage.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.screenshot({
    path: "docs/screenshots/fase-2-avatar-transaksi.png",
    fullPage: true,
  });
  await header.getByRole("button", { name: /Ridwan Pemilik keluarga/ }).click();
  await page
    .getByRole("menuitem", { name: "Lihat sebagai Sari", exact: true })
    .click();
  await expect(
    header.getByRole("button", {
      name: "S Sari Anggota keluarga",
      exact: true,
    }),
  ).toBeVisible();
  await expect(authorImage).toBeVisible();
});
