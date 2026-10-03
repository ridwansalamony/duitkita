import { normalizeGoals, type DemoData } from "@/lib/dummy/store";
function ledger(data: DemoData, walletId?: string) {
  const transactions = data.transactions.reduce(
    (sum, t) =>
      sum +
      (walletId
        ? (t.walletId === walletId
            ? t.type === "income"
              ? t.amount
              : -t.amount
            : 0) + (t.toWalletId === walletId ? t.amount : 0)
        : t.type === "income"
          ? t.amount
          : t.type === "expense"
            ? -t.amount
            : 0),
    0,
  );
  return transactions;
}
// Terapkan selisih transaksi pada saldo snapshot; transfer tidak mengubah total keluarga.
export function optimisticBalances(
  before: DemoData,
  after: DemoData,
): DemoData {
  return normalizeGoals({
    ...after,
    familyBalance:
      before.familyBalance === undefined
        ? undefined
        : before.familyBalance + ledger(after) - ledger(before),
    walletBalances: before.walletBalances
      ? Object.fromEntries(
          after.wallets.map((w) => [
            w.id,
            (before.walletBalances?.[w.id] || 0) +
              ledger(after, w.id) -
              ledger(before, w.id),
          ]),
        )
      : undefined,
  });
}
