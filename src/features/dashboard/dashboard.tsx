"use client";
import { today, daysAgo } from "@/lib/mode";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  CalendarDays,
  Eye,
  EyeOff,
  Plus,
  Sparkles,
  Wallet as WalletIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CurrencyDisplay,
  FeatureIcon,
  PageHeading,
  Reveal,
} from "@/components/shared/common";
import {
  useDemo,
  visibleWallets,
  visibleTransactions,
  walletBalance,
  goalAmount,
} from "@/lib/dummy/store";
import { TrendChart, CompositionChart } from "./charts";
import { TransactionTable } from "@/features/transactions/table";
import { rupiah } from "@/lib/utils";
export function Dashboard() {
  const { data, user, familyId } = useDemo();
  const [hidden, setHidden] = useState(false);
  const wallets = visibleWallets(data, familyId, user.id);
  const transactions = visibleTransactions(data, familyId, user.id);
  const all = data.transactions.filter(
    (t) => t.familyId === familyId && t.date.startsWith(today().slice(0, 7)),
  );
  const total =
    data.familyBalance ??
    data.wallets
      .filter((w) => w.familyId === familyId)
      .reduce((sum, w) => sum + walletBalance(data, familyId, w.id), 0);
  const income = all
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = all
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const goals = data.goals.filter(
    (g) => g.familyId === familyId && g.status !== "archived",
  );
  const savingWallets = new Set(goals.map((g) => g.walletId));
  const monthlySaved = all.reduce(
    (sum, t) =>
      sum +
      (t.toWalletId && savingWallets.has(t.toWalletId) ? t.amount : 0) +
      (savingWallets.has(t.walletId)
        ? t.type === "income"
          ? t.amount
          : -t.amount
        : 0),
    0,
  );
  const visibleMonth = transactions.filter((t) =>
    t.date.startsWith(today().slice(0, 7)),
  );
  const trend = Array.from({ length: 7 }, (_, i) => {
    const day = daysAgo(6 - i);
    const dayTx = transactions.filter((t) => t.date === day);
    return {
      name: new Date(day + "T12:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      }),
      expense: dayTx
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
      income: dayTx
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
    };
  });
  const composition = data.categories
    .filter((c) => c.familyId === familyId && c.type === "expense")
    .map((c) => ({
      name: c.name,
      value: visibleMonth
        .filter((t) => t.type === "expense" && t.categoryId === c.id)
        .reduce((s, t) => s + t.amount, 0),
      color: c.color,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
  return (
    <Reveal>
      <PageHeading
        title={`Halo, ${user.name.split(" ")[0]}! 👋`}
        description="Setiap langkah kecil berarti. Ini cerita keuangan keluarga Anda hari ini."
        action={
          <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5 text-xs text-muted-foreground">
            <CalendarDays size={14} />{" "}
            {new Date(today() + "T12:00:00").toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </div>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-[#703ee8] p-6 text-white shadow-sm">
          <div className="absolute -right-12 -top-10 size-52 rounded-full border-[26px] border-white/[.06]" />
          <div className="relative flex items-center justify-between">
            <p className="text-xs text-white/80">Saldo keluarga</p>
            <button
              onClick={() => setHidden(!hidden)}
              aria-label={hidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
            >
              {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="number relative mt-4 text-[30px] font-semibold">
            {hidden ? "Rp ••••••••" : rupiah(total)}
          </p>
          <div className="relative mt-5 flex items-center justify-between gap-2">
            <span className="text-[10px] text-white/70">
              Gabungan seluruh dompet keluarga
            </span>
            <WalletIcon size={17} className="text-white/60" />
          </div>
        </div>
        {[
          {
            title: "Pemasukan bulan ini",
            amount: income,
            icon: ArrowDownLeft,
            color: "text-success",
            bg: "bg-success-surface",
            note: "Dari kerja keras Anda berdua",
          },
          {
            title: "Pengeluaran bulan ini",
            amount: expense,
            icon: ArrowUpRight,
            color: "text-destructive",
            bg: "bg-rose-50 dark:bg-rose-500/10",
            note: "Kebutuhan & cerita sehari-hari",
          },
        ].map((s) => (
          <div key={s.title} className="panel">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{s.title}</p>
              <span
                className={`flex size-8 items-center justify-center rounded-lg ${s.bg} ${s.color}`}
              >
                <s.icon size={16} />
              </span>
            </div>
            <CurrencyDisplay
              amount={s.amount}
              className="mt-3 block text-[25px] font-semibold"
            />
            <p className="mt-4 text-[10px] text-muted-foreground">{s.note}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-primary/10 bg-secondary/50 px-4 py-3">
        <Sparkles size={16} className="text-primary" />
        <p className="flex-1 text-xs leading-5 text-secondary-foreground">
          Bulan ini Anda berdua menyisihkan{" "}
          <strong>{rupiah(monthlySaved)}</strong> untuk impian bersama.
          Pelan-pelan, kita sampai.
        </p>
        <Link
          href="/tabungan"
          className="flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-primary"
        >
          Lihat target <ArrowRight size={13} />
        </Link>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <section className="panel min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Arus keuangan</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Dompet yang dapat Anda akses · 7 hari terakhir
              </p>
            </div>
            <div className="flex gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Pemasukan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-violet-500" />
                Pengeluaran
              </span>
            </div>
          </div>
          <TrendChart data={trend} />
          <div className="mt-4 border-t pt-4 text-[11px] text-muted-foreground">
            Catatan teratur membantu Anda mengenali ritme belanja keluarga.
          </div>
        </section>
        <section className="panel">
          <h2 className="text-sm font-bold">Ke mana uang kita?</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Pengeluaran{" "}
            {new Date(today() + "T12:00:00").toLocaleDateString("id-ID", {
              month: "long",
            })}{" "}
            · sesuai akses dompet
          </p>
          <CompositionChart
            data={composition.slice(0, 4).concat(
              composition.length > 4
                ? [
                    {
                      name: "Kategori lainnya",
                      value: composition
                        .slice(4)
                        .reduce((s, c) => s + c.value, 0),
                      color: "#c4b5fd",
                    },
                  ]
                : [],
            )}
          />
        </section>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <section className="panel min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold">Transaksi terbaru</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Cerita kecil di balik setiap rupiah
              </p>
            </div>
            <Link
              href="/transaksi"
              className="flex items-center gap-1 text-[11px] font-medium text-primary"
            >
              Lihat semua <ArrowRight size={13} />
            </Link>
          </div>
          <TransactionTable transactions={transactions.slice(0, 5)} compact />
        </section>
        <section className="panel">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-bold">Impian kita</h2>
            <Link
              href="/tabungan"
              aria-label="Lihat semua target"
              className="text-muted-foreground"
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="space-y-6">
            {goals.slice(0, 3).map((g) => {
              const amount = goalAmount(data, familyId, g.id);
              const pct = Math.round((amount / g.target) * 100);
              return (
                <Link key={g.id} href={`/tabungan/${g.id}`} className="block">
                  <div className="mb-3 flex items-center gap-3">
                    <FeatureIcon
                      name={g.icon}
                      className="size-9 rounded-xl"
                      color="#f59e0b"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold">{g.name}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {rupiah(amount)}{" "}
                        <span className="text-muted-foreground/60">
                          dari {rupiah(g.target)}
                        </span>
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-primary">
                      {pct}%
                    </span>
                  </div>
                  <Progress value={Math.min(pct, 100)} className="h-1.5" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
      <section className="mt-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold">Dompet Anda</h2>
          <Link href="/dompet" className="text-[11px] font-medium text-primary">
            Kelola dompet →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {wallets.map((w) => (
            <Link
              key={w.id}
              href="/dompet"
              className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <FeatureIcon color={w.color} />
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">
                  {w.name}
                </p>
                <CurrencyDisplay
                  amount={walletBalance(data, familyId, w.id)}
                  className="mt-1 block text-lg font-semibold"
                />
              </div>
              <ArrowUpRight
                size={15}
                className="ml-auto shrink-0 text-muted-foreground"
              />
            </Link>
          ))}
        </div>
      </section>
      <Button
        asChild
        size="icon"
        className="gradient-button fixed bottom-23 right-5 z-20 size-12 rounded-full shadow-lg sm:hidden"
      >
        <Link href="/transaksi/baru" aria-label="Catat transaksi">
          <Plus />
        </Link>
      </Button>
    </Reveal>
  );
}
