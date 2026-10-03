import type { Transaction } from "@/lib/dummy/data";
const cents = (amount: number) => BigInt(Math.round(amount * 100));
function effect(transaction: Transaction | undefined, walletId: string) {
  if (!transaction) return BigInt(0);
  return (
    (transaction.walletId === walletId
      ? cents(transaction.amount) *
        (transaction.type === "income" ? BigInt(1) : -BigInt(1))
      : BigInt(0)) +
    (transaction.type === "transfer" && transaction.toWalletId === walletId
      ? cents(transaction.amount)
      : BigInt(0))
  );
}
// Periksa selisih, sehingga transaksi lama boleh diperbaiki tanpa menghitungnya dua kali.
export function insufficientWallet(
  balances: Record<string, number>,
  previous?: Transaction,
  next?: Transaction,
) {
  const affected = new Set([
    previous?.walletId,
    previous?.toWalletId,
    next?.walletId,
    next?.toWalletId,
  ]);
  for (const id of affected) {
    if (!id || !(id in balances)) continue;
    const delta = effect(next, id) - effect(previous, id);
    if (delta < BigInt(0) && cents(balances[id]) + delta < BigInt(0)) return id;
  }
  return undefined;
}
export const insufficientFundsMessage =
  "Saldo dompet belum mencukupi. Kurangi nominal atau periksa kembali transaksi yang ingin diubah atau dihapus.";
