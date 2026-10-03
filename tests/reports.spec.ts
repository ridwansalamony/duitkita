import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { demoReport, reportFilter } from "../src/lib/reports";
import * as seed from "../src/lib/dummy/data";
import type { DemoData } from "../src/lib/dummy/store";

test("laporan memakai sen, filter keluarga/bulan, dan mengecualikan transfer dari arus kas", () => {
  const data: DemoData = {
    familyName: "Budi & Sari",
    inviteCode: "",
    users: seed.users,
    wallets: seed.wallets,
    categories: seed.categories,
    goals: [],
    contributions: [],
    logs: [],
    transactions: [
      {
        ...seed.transactions[0],
        id: "1",
        date: "2026-10-01",
        amount: 0.1,
        type: "expense",
      },
      {
        ...seed.transactions[0],
        id: "2",
        date: "2026-10-01",
        amount: 0.2,
        type: "expense",
      },
      {
        ...seed.transactions[0],
        id: "3",
        date: "2026-10-01",
        amount: 50,
        type: "transfer",
        toWalletId: "darurat",
      },
      {
        ...seed.transactions[0],
        id: "4",
        date: "2026-10-01",
        amount: 900,
        familyId: "foreign",
      },
      { ...seed.transactions[0], id: "5", date: "2026-09-30", amount: 800 },
    ],
  };
  const report = demoReport(data, seed.FAMILY_ID, "2026-10-01", "2026-10-31");
  expect(report.expense).toBe(0.3);
  expect(report.income).toBe(0);
  expect(report.transactions).toHaveLength(3);
  expect(report.category.reduce((sum, r) => sum + r.expense, 0)).toBe(0.3);
  expect(
    reportFilter.safeParse({ start: "2026-10-31", end: "2026-10-01" }).success,
  ).toBe(false);
  expect(
    reportFilter.safeParse({ start: "2026-02-30", end: "2026-10-01" }).success,
  ).toBe(false);
});

test("unduhan Excel berisi nominal angka serta PDF memiliki dokumen valid", async ({
  page,
}, testInfo) => {
  await page.goto("/laporan");
  await expect(
    page.getByRole("button", { name: "Excel", exact: true }),
  ).toBeEnabled();
  const excelPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Excel", exact: true }).click();
  const excel = await excelPromise;
  const excelPath = testInfo.outputPath("laporan.xlsx");
  await excel.saveAs(excelPath);
  const book = XLSX.readFile(excelPath);
  expect(book.SheetNames).toEqual([
    "Transaksi",
    "Summary Kategori",
    "Summary Anggota",
    "Ringkasan",
  ]);
  const rows = XLSX.utils
    .sheet_to_json<(string | number)[]>(book.Sheets.Transaksi, { header: 1 })
    .slice(4);
  expect(rows.some((r) => r[1] === "Transfer")).toBe(true);
  expect(rows.every((r) => typeof r[7] === "number")).toBe(true);
  const expected = rows
    .filter((r) => r[1] === "Pengeluaran")
    .reduce((sum, r) => sum + Number(r[7]), 0);
  const summary = XLSX.utils.sheet_to_json<(string | number)[]>(
    book.Sheets.Ringkasan,
    { header: 1 },
  );
  expect(summary.find((r) => r[0] === "Pengeluaran")?.[1]).toBe(expected);
  const pdfPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PDF", exact: true }).click();
  const pdf = await pdfPromise;
  const pdfPath = testInfo.outputPath("laporan.pdf");
  await pdf.saveAs(pdfPath);
  expect(readFileSync(pdfPath).subarray(0, 5).toString()).toBe("%PDF-");
  expect(readFileSync(pdfPath).length).toBeGreaterThan(10000);
  await page.screenshot({
    path: "docs/screenshots/fase-3-laporan.png",
    fullPage: true,
  });
  await page.getByLabel("Dari tanggal").fill("2027-01-01");
  await expect(
    page.getByRole("button", { name: "Excel", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Periksa rentang tanggal" }),
  ).toBeVisible();
});
