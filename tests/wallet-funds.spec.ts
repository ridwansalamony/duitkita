import { test, expect } from "@playwright/test";
import { insufficientWallet } from "../src/lib/workspace/funds";
import type { Transaction } from "../src/lib/dummy/data";
const transfer: Transaction = {
  id: "t",
  familyId: "f",
  userId: "budi",
  walletId: "utama",
  toWalletId: "bali",
  type: "transfer",
  amount: 100,
  categoryId: "",
  date: "2026-10-03",
  description: "Tabungan Bali",
};
test("transfer dari saldo nol dan nominal melebihi saldo ditolak; pas saldo diizinkan", () => {
  expect(insufficientWallet({ utama: 0, bali: 0 }, undefined, transfer)).toBe(
    "utama",
  );
  expect(
    insufficientWallet({ utama: 99.99, bali: 0 }, undefined, transfer),
  ).toBe("utama");
  expect(
    insufficientWallet({ utama: 100, bali: 0 }, undefined, transfer),
  ).toBeUndefined();
  expect(
    insufficientWallet({ utama: 0.29, bali: 0 }, undefined, {
      ...transfer,
      amount: 0.29,
    }),
  ).toBeUndefined();
});
test("edit menghitung selisih dan mengecek dompet tujuan lama ketika dana terpakai", () => {
  expect(
    insufficientWallet({ utama: 0, bali: 100 }, transfer, {
      ...transfer,
      description: "Catatan baru",
    }),
  ).toBeUndefined();
  expect(
    insufficientWallet({ utama: 0, bali: 100 }, transfer, {
      ...transfer,
      amount: 101,
    }),
  ).toBe("utama");
  expect(
    insufficientWallet({ utama: 0, bali: 30 }, transfer, {
      ...transfer,
      amount: 60,
    }),
  ).toBe("bali");
  expect(
    insufficientWallet({ utama: 0, bali: 100 }, transfer, {
      ...transfer,
      amount: 60,
    }),
  ).toBeUndefined();
  expect(
    insufficientWallet({ utama: 0, bali: 30, mobil: 0 }, transfer, {
      ...transfer,
      toWalletId: "mobil",
    }),
  ).toBe("bali");
});
test("hapus transfer/pemasukan terpakai ditolak; koreksi minus lama diperbolehkan", () => {
  expect(insufficientWallet({ utama: 0, bali: 30 }, transfer, undefined)).toBe(
    "bali",
  );
  expect(
    insufficientWallet({ utama: 0, bali: 100 }, transfer, undefined),
  ).toBeUndefined();
  const income = {
    ...transfer,
    type: "income" as const,
    toWalletId: undefined,
  };
  expect(insufficientWallet({ utama: 20 }, income, undefined)).toBe("utama");
  expect(
    insufficientWallet({ utama: -100, bali: 100 }, transfer, undefined),
  ).toBeUndefined();
  expect(
    insufficientWallet({ utama: -100, bali: 100 }, transfer, {
      ...transfer,
      amount: 50,
    }),
  ).toBeUndefined();
  expect(
    insufficientWallet({ utama: -100, bali: 100 }, undefined, transfer),
  ).toBe("utama");
});
