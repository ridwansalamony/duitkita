import { normalizeGoals, type DemoData } from "@/lib/dummy/store";
function ledger(data: DemoData) {
  const wallets = new Map<string, bigint>();
  const owners = new Map(data.wallets.map((w) => [w.id, w.familyId]));
  let total = BigInt(0);
  for (const t of data.transactions) {
    if (owners.get(t.walletId) !== t.familyId) continue;
    const amount = BigInt(Math.round(t.amount * 100));
    wallets.set(
      t.walletId,
      (wallets.get(t.walletId) ?? BigInt(0)) +
        (t.type === "income" ? amount : -amount),
    );
    if (
      t.type === "transfer" &&
      t.toWalletId &&
      owners.get(t.toWalletId) === t.familyId
    )
      wallets.set(
        t.toWalletId,
        (wallets.get(t.toWalletId) ?? BigInt(0)) + amount,
      );
    if (t.type !== "transfer") total += t.type === "income" ? amount : -amount;
  }
  return { total, wallets };
}
// Terapkan selisih transaksi pada saldo snapshot; transfer tidak mengubah total keluarga.
export function optimisticBalances(
  before: DemoData,
  after: DemoData,
): DemoData {
  const previous = ledger(before),
    next = ledger(after);
  return normalizeGoals({
    ...after,
    familyBalance:
      before.familyBalance === undefined
        ? undefined
        : Number(
            BigInt(Math.round(before.familyBalance * 100)) +
              next.total -
              previous.total,
          ) / 100,
    walletBalances: before.walletBalances
      ? Object.fromEntries(
          after.wallets.map((w) => [
            w.id,
            Number(
              BigInt(Math.round((before.walletBalances?.[w.id] ?? 0) * 100)) +
                (next.wallets.get(w.id) ?? BigInt(0)) -
                (previous.wallets.get(w.id) ?? BigInt(0)),
            ) / 100,
          ]),
        )
      : undefined,
  });
}
