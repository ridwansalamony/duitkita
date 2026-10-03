import { test, expect } from "@playwright/test";
import { mutationIntent } from "../src/lib/workspace/intent";
import { optimisticBalances } from "../src/lib/workspace/optimistic";
import type { DemoData } from "../src/lib/dummy/store";
const empty: DemoData = {
  familyName: "Keluarga Budi & Sari",
  inviteCode: "DUIT-XY7A",
  users: [],
  wallets: [],
  categories: [],
  transactions: [],
  goals: [],
  contributions: [],
  logs: [],
};
test("penghapusan kategori mengirim satu niat, bukan mempercayai perubahan transaksi dari klien", () => {
  const category = {
    id: "makan",
    familyId: "keluarga",
    name: "Makan",
    type: "expense" as const,
    color: "#ffffff",
    icon: "tag",
  };
  const tx = {
    id: "tx",
    familyId: "keluarga",
    userId: "budi",
    walletId: "rumah",
    categoryId: "makan",
    type: "expense" as const,
    amount: 1000,
    date: "2026-10-01",
    description: "Belanja",
  };
  const before = { ...empty, categories: [category], transactions: [tx] };
  expect(
    mutationIntent(
      before,
      {
        ...before,
        categories: [],
        transactions: [{ ...tx, categoryId: "lainnya" }],
      },
      "budi",
    ),
  ).toEqual({ entity: "categories", action: "delete", value: "makan" });
});
test("transfer satu operasi, saldo keluarga tetap dan target mengikuti CRUD", () => {
  const wallet = {
    id: "rumah",
    familyId: "keluarga",
    name: "Rumah",
    type: "shared" as const,
    ownerUserId: null,
    color: "#ffffff",
  };
  const goal = {
    id: "g",
    familyId: "keluarga",
    name: "Bali",
    walletId: "liburan",
    target: 50000,
    deadline: "",
    icon: "plane",
    status: "active" as const,
  };
  const before = {
    ...empty,
    wallets: [wallet, { ...wallet, id: "liburan" }],
    goals: [goal],
    familyBalance: 100000,
    walletBalances: { rumah: 100000, liburan: 0 },
  };
  const transaction = {
    id: "t",
    familyId: "keluarga",
    userId: "budi",
    walletId: "rumah",
    toWalletId: "liburan",
    categoryId: "",
    type: "transfer" as const,
    amount: 50000,
    date: "2026-10-02",
    description: "Tabungan Bali",
  };
  const after = { ...before, transactions: [transaction] };
  expect(mutationIntent(before, after, "budi").entity).toBe("transactions");
  const saved = optimisticBalances(before, after);
  expect(saved.familyBalance).toBe(100000);
  expect(saved.walletBalances).toEqual({ rumah: 50000, liburan: 50000 });
  expect(saved.goals[0].status).toBe("achieved");
  const edited = optimisticBalances(saved, {
    ...saved,
    transactions: [{ ...transaction, amount: 20000 }],
  });
  expect(edited.walletBalances).toEqual({ rumah: 80000, liburan: 20000 });
  expect(edited.goals[0].status).toBe("active");
  const deleted = optimisticBalances(edited, { ...edited, transactions: [] });
  expect(deleted.walletBalances).toEqual(before.walletBalances);
  expect(deleted.familyBalance).toBe(100000);
});
