"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Pencil, Trash2, FileText, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CurrencyDisplay,
  CategoryBadge,
  EmptyState,
  PageHeading,
  TxIcon,
} from "@/components/shared/common";
import {
  useDemo,
  visibleTransactions,
  visibleWallets,
} from "@/lib/dummy/store";
import { tanggal } from "@/lib/utils";
import { TransactionEditor } from "./editor";
export function TransactionDetail({ id }: { id: string }) {
  const { data, user, familyId, update, log } = useDemo();
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [remove, setRemove] = useState(false);
  const tx = visibleTransactions(data, familyId, user.id).find(
    (t) => t.id === id,
  );
  if (!tx)
    return (
      <EmptyState
        title="Transaksi tidak ditemukan"
        description="Catatan mungkin sudah dihapus atau berada di dompet yang tidak dapat Anda akses."
        href="/transaksi"
        cta="Kembali ke transaksi"
      />
    );
  if (edit)
    return <TransactionEditor initial={tx} onDone={() => setEdit(false)} />;
  const wallets = visibleWallets(data, familyId, user.id);
  const history = data.logs.filter(
    (l) =>
      l.familyId === familyId &&
      l.entityId === id &&
      (!l.privateOwnerId || l.privateOwnerId === user.id),
  );
  return (
    <>
      <Link
        href="/transaksi"
        className="mb-5 inline-flex items-center gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft size={14} />
        Semua transaksi
      </Link>
      <PageHeading
        title="Cerita di balik catatan"
        description={`Dicatat ${tanggal(tx.date, true)} · ${tx.id.slice(0, 16).toUpperCase()}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEdit(true)}>
              <Pencil size={14} />
              Ubah
            </Button>
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => setRemove(true)}
            >
              <Trash2 size={14} />
              Hapus
            </Button>
          </div>
        }
      />
      <div
        className={`grid items-start gap-6 ${tx.type === "expense" ? "lg:grid-cols-[1.2fr_1fr]" : "max-w-3xl"}`}
      >
        <div className="space-y-6">
          <section className="panel">
            <div className="flex items-center gap-4">
              <TxIcon type={tx.type} />
              <div>
                <p className="text-xs text-muted-foreground">
                  {tx.type === "income"
                    ? "Pemasukan"
                    : tx.type === "expense"
                      ? "Pengeluaran"
                      : "Transfer antar dompet"}
                </p>
                <CurrencyDisplay
                  amount={tx.amount}
                  type={tx.type}
                  className="mt-1 block text-3xl font-semibold"
                />
              </div>
            </div>
            <h2 className="mt-6 text-xl font-bold">{tx.description}</h2>
            <dl className="mt-6 grid grid-cols-2 gap-y-5 border-t pt-6 text-sm">
              <dt className="text-muted-foreground">Kategori</dt>
              <dd>
                <CategoryBadge
                  category={data.categories.find(
                    (c) => c.familyId === familyId && c.id === tx.categoryId,
                  )}
                />
              </dd>
              <dt className="text-muted-foreground">Dompet</dt>
              <dd>{wallets.find((w) => w.id === tx.walletId)?.name}</dd>
              {tx.toWalletId && (
                <>
                  <dt className="text-muted-foreground">Dompet tujuan</dt>
                  <dd>{wallets.find((w) => w.id === tx.toWalletId)?.name}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Tanggal</dt>
              <dd>{tanggal(tx.date, true)}</dd>
              <dt className="text-muted-foreground">Dicatat oleh</dt>
              <dd>
                {
                  data.users.find(
                    (u) => u.familyId === familyId && u.id === tx.userId,
                  )?.name
                }
              </dd>
            </dl>
          </section>
          <section className="panel">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Clock3 size={17} />
              Riwayat perubahan
            </h2>
            <div className="mt-5 space-y-5">
              {history.length ? (
                history.map((l) => (
                  <div key={l.id} className="border-l-2 border-primary/25 pl-4">
                    <p className="text-xs leading-6">{l.detail}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {tanggal(l.date, true)} ·{" "}
                      {
                        data.users.find(
                          (u) => u.id === l.userId && u.familyId === familyId,
                        )?.name
                      }
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Catatan awal dibuat oleh{" "}
                  {
                    data.users.find(
                      (u) => u.id === tx.userId && u.familyId === familyId,
                    )?.name
                  }
                  . Belum ada perubahan.
                </p>
              )}
            </div>
          </section>
        </div>
        {tx.type === "expense" && (
          <section className="panel">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <FileText size={17} />
              Bukti struk
            </h2>
            {tx.receipt ? (
              <div className="mt-5 rounded-xl bg-canvas p-4">
                <Image
                  src={tx.receipt}
                  width={400}
                  height={510}
                  alt={`Struk ${tx.description}`}
                  className="max-h-137.5 w-full object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed p-10 text-center">
                <FileText
                  size={28}
                  className="mx-auto text-muted-foreground/50"
                />
                <p className="mt-3 text-sm font-medium">
                  Tidak ada struk terlampir
                </p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  Tidak apa-apa, catatan Anda tetap lengkap. Tambahkan struk
                  lewat tombol Ubah bila diperlukan.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
      <Dialog open={remove} onOpenChange={setRemove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus catatan ini?</DialogTitle>
            <DialogDescription>
              Transaksi “{tx.description}” akan dihapus. Saldo dompet akan
              dihitung ulang.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemove(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const owner =
                  wallets.find((w) => w.id === tx.walletId)?.ownerUserId ??
                  wallets.find((w) => w.id === tx.toWalletId)?.ownerUserId ??
                  undefined;
                if (
                  !(await update((d) => ({
                    ...d,
                    transactions: d.transactions.filter(
                      (t) => !(t.id === id && t.familyId === familyId),
                    ),
                    logs: log(
                      d,
                      "delete",
                      "Transaksi",
                      id,
                      `Menghapus ${tx.description}`,
                      owner,
                    ),
                  })))
                )
                  return;
                toast.success("Transaksi berhasil dihapus");
                router.push("/transaksi");
              }}
            >
              Ya, Hapus Transaksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
