"use client";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ArrowUpRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CategoryBadge,
  CurrencyDisplay,
  EmptyState,
  TxIcon,
} from "@/components/shared/common";
import { useDemo, visibleWallets } from "@/lib/dummy/store";
import { tanggal } from "@/lib/utils";
import type { Transaction } from "@/lib/dummy/data";
export function TransactionTable({
  transactions,
  compact = false,
}: {
  transactions: Transaction[];
  compact?: boolean;
}) {
  const { data, familyId, user } = useDemo();
  const wallets = visibleWallets(data, familyId, user.id);
  if (!transactions.length)
    return (
      <EmptyState
        title="Belum ada transaksi yang cocok"
        description="Coba ubah filter pencarian atau catat transaksi pertama Anda."
        href="/transaksi/baru"
        cta="Catat transaksi"
      />
    );
  return (
    <>
      {compact && (
        <div className="divide-y md:hidden">
          {transactions.map((t) => (
            <Link
              key={t.id}
              href={`/transaksi/${t.id}`}
              className="flex items-start gap-3 py-4"
            >
              <TxIcon type={t.type} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium leading-5">{t.description}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {tanggal(t.date)}
                  </span>
                  <CurrencyDisplay
                    amount={t.amount}
                    type={t.type}
                    className="text-xs font-semibold"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className={compact ? "hidden md:block" : undefined}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Transaksi</TableHead>
              {!compact && (
                <>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Dompet</TableHead>
                  <TableHead>Dicatat oleh</TableHead>
                </>
              )}
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Nominal</TableHead>
              <TableHead className="w-8">
                <span className="sr-only">Buka</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Link
                    className="flex items-center gap-3 py-2"
                    href={`/transaksi/${t.id}`}
                  >
                    <TxIcon type={t.type} />
                    <span className="min-w-[130px]">
                      <span className="block max-w-[230px] truncate text-xs font-medium">
                        {t.description}
                      </span>
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        {compact
                          ? (data.categories.find(
                              (c) =>
                                c.id === t.categoryId &&
                                c.familyId === familyId,
                            )?.name ?? "Antar dompet")
                          : t.id.startsWith("trx-")
                            ? t.id.toUpperCase()
                            : `TRX-${t.id.slice(0, 8).toUpperCase()}`}
                      </span>
                    </span>
                  </Link>
                </TableCell>
                {!compact && (
                  <>
                    <TableCell>
                      <CategoryBadge
                        category={data.categories.find(
                          (c) =>
                            c.familyId === familyId && c.id === t.categoryId,
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {wallets.find((w) => w.id === t.walletId)?.name}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-xs">
                        <UserAvatar
                          user={data.users.find(
                            (u) => u.id === t.userId && u.familyId === familyId,
                          )}
                          className="size-6"
                          fallbackClassName="bg-secondary text-[10px] text-primary"
                        />
                        {
                          data.users
                            .find(
                              (u) =>
                                u.id === t.userId && u.familyId === familyId,
                            )
                            ?.name.split(" ")[0]
                        }
                      </span>
                    </TableCell>
                  </>
                )}
                <TableCell className="text-xs text-muted-foreground">
                  {tanggal(t.date)}
                </TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay
                    amount={t.amount}
                    type={t.type}
                    className="text-xs font-semibold"
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/transaksi/${t.id}`}
                    aria-label={`Detail ${t.description}`}
                    className="inline-flex p-2 text-muted-foreground"
                  >
                    <ArrowUpRight size={14} />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
