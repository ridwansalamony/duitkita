import { test, expect } from "@playwright/test";
import { categoryBudget } from "../src/lib/workspace/budget";
import {
  parseCurrencyInput,
  formatCurrencyInput,
} from "../src/lib/currency-input";
import type { Category, Transaction } from "../src/lib/dummy/data";

test("budget hanya menjumlah pengeluaran keluarga, kategori dan bulan yang dipilih", () => {
  const category: Category = {
    id: "food",
    familyId: "family",
    type: "expense",
    monthlyBudget: 2000000,
    name: "Makanan",
    color: "#fff",
    icon: "tag",
  };
  const base: Transaction = {
    id: "a",
    familyId: "family",
    userId: "budi",
    walletId: "wallet",
    categoryId: "food",
    type: "expense",
    amount: 100000,
    date: "2026-10-01",
    description: "Sayur",
  };
  const transactions: Transaction[] = [
    base,
    { ...base, id: "b", amount: 0.1 },
    { ...base, id: "c", amount: 0.2 },
    { ...base, id: "d", familyId: "other" },
    { ...base, id: "e", type: "income" },
    { ...base, id: "f", type: "transfer" },
    { ...base, id: "g", date: "2026-09-30" },
    { ...base, id: "h", categoryId: "transport" },
  ];
  expect(
    categoryBudget(category, transactions, "family", "2026-10")?.spent,
  ).toBe(100000.3);
  expect(
    categoryBudget(category, transactions, "family", "2026-10", "a")?.spent,
  ).toBe(0.3);
  expect(categoryBudget(category, transactions, "other", "2026-10")).toBeNull();
  expect(
    categoryBudget(
      { ...category, monthlyBudget: undefined },
      transactions,
      "family",
      "2026-10",
    ),
  ).toBeNull();
});

test("nominal Indonesia mempertahankan sen, paste prefiks, dan nilai kosong", () => {
  expect(parseCurrencyInput("Rp20.000.000,25")).toBe("20000000.25");
  expect(formatCurrencyInput("20000000.25")).toBe("20.000.000,25");
  expect(parseCurrencyInput("00012,3")).toBe("12.3");
  expect(formatCurrencyInput("")).toBe("");
  expect(formatCurrencyInput("0.01")).toBe("0,01");
});
