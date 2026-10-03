import { test, expect } from "@playwright/test";
import { parseReceipt } from "../src/lib/receipts/parse";

test("total belanja tidak tertukar dengan subtotal, tunai, atau kembalian", () => {
  expect(
    parseReceipt(
      "SATE PADANG AJO\nJl. Melati 12\n30/09/2026\nSubtotal 80.000\nPajak 7.500\nTOTAL Rp 87.500\nTUNAI 100.000\nKEMBALI 12.500",
    ),
  ).toEqual({ merchant: "SATE PADANG AJO", total: 87500, date: "2026-09-30" });
});
test("format uang dan total pada baris terpisah", () => {
  for (const value of [
    "1.250.500,50",
    "1,250,500.50",
    "1250500,50",
    "1250500.50",
  ]) {
    expect(
      parseReceipt(`TOKO BUDI\nTOTAL BAYAR\nRp ${value}\n2026-10-01`).total,
    ).toBe(1250500.5);
  }
});
test("nilai tidak pasti dibiarkan kosong", () => {
  expect(parseReceipt("\n")).toEqual({
    merchant: null,
    total: null,
    date: null,
  });
  expect(parseReceipt("TOTAL 87.500\nTOTAL 88.500\n31/02/2026")).toEqual({
    merchant: null,
    total: null,
    date: null,
  });
  for (const line of [
    "SUBTOTAL 87.500",
    "TOTAL ITEM 3",
    "TOTAL 87.5.00",
    "TOTAL -500",
    "TUNAI 100.000",
    "TOTAL 87500 DISKON 5000",
  ]) {
    expect(parseReceipt(line).total).toBeNull();
  }
  expect(parseReceipt("30/09/2026\n01/10/2026").date).toBeNull();
});
