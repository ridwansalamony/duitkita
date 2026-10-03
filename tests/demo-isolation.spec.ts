import { test, expect } from "@playwright/test";
import * as seed from "../src/lib/dummy/data";
import {
  visibleWallets,
  visibleTransactions,
  walletBalance,
  goalAmount,
  type DemoData,
} from "../src/lib/dummy/store";

test("helper demo menolak keluarga lain dan membagi semua dompet dengan pasangan", () => {
  const foreign = "family-lain";
  const data: DemoData = {
    familyName: "Keluarga Budi & Sari",
    inviteCode: "DUIT-XY7A",
    users: [
      ...seed.users,
      {
        id: "asing",
        familyId: foreign,
        name: "Keluarga Lain",
        email: "lain@example.com",
        role: "owner",
      },
    ],
    wallets: [
      ...seed.wallets,
      {
        id: "asing-wallet",
        familyId: foreign,
        name: "Dompet Keluarga Lain",
        type: "shared",
        ownerUserId: null,
        color: "#000000",
      },
    ],
    transactions: [
      ...seed.transactions,
      {
        id: "asing-tx",
        familyId: foreign,
        userId: "asing",
        walletId: "asing-wallet",
        type: "income",
        amount: 99999999,
        description: "Data keluarga lain",
        date: "2026-09-30",
        categoryId: "gaji",
      },
    ],
    categories: seed.categories,
    goals: seed.goals,
    contributions: seed.contributions,
    logs: seed.auditLogs,
  };
  expect(visibleWallets(data, foreign, "budi")).toEqual([]);
  expect(visibleTransactions(data, foreign, "budi")).toEqual([]);
  expect(
    visibleTransactions(data, seed.FAMILY_ID, "budi").some(
      (t) => t.id === "asing-tx",
    ),
  ).toBe(false);
  expect(visibleWallets(data, seed.FAMILY_ID, "budi")).toEqual(
    visibleWallets(data, seed.FAMILY_ID, "sari"),
  );
  expect(walletBalance(data, seed.FAMILY_ID, "asing-wallet")).toBe(0);
  expect(walletBalance(data, seed.FAMILY_ID, "rumah")).toBe(14352500);
  expect(goalAmount(data, foreign, "rumah-impian")).toBe(0);
  expect(goalAmount(data, seed.FAMILY_ID, "rumah-impian")).toBe(42500000);
});
