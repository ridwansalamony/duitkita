"use client";
import { today, monthStart } from "@/lib/mode";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AddLink,
  CurrencyDisplay,
  PageHeading,
  Reveal,
} from "@/components/shared/common";
import {
  useDemo,
  visibleTransactions,
  visibleWallets,
} from "@/lib/dummy/store";
import { TransactionTable } from "./table";
export function TransactionsPage() {
  const { data, user, familyId } = useDemo();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [member, setMember] = useState("");
  const [wallet, setWallet] = useState("");
  const [start, setStart] = useState(monthStart());
  const [end, setEnd] = useState(today());
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const transactions = visibleTransactions(data, familyId, user.id).filter(
    (t) =>
      (!search || t.description.toLowerCase().includes(search.toLowerCase())) &&
      (!category || t.categoryId === category) &&
      (!member || t.userId === member) &&
      (!wallet || t.walletId === wallet || t.toWalletId === wallet) &&
      (!start || t.date >= start) &&
      (!end || t.date <= end) &&
      (!type || t.type === type),
  );
  const totalPages = Math.max(1, Math.ceil(transactions.length / 8));
  const currentPage = Math.min(page, totalPages);
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  return (
    <Reveal>
      <PageHeading
        title="Catatan keuangan kita"
        description="Setiap rupiah punya cerita. Temukan dan kelola semuanya di sini."
        action={<AddLink href="/transaksi/baru">Catat Transaksi</AddLink>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Pemasukan", income],
          ["Pengeluaran", expense],
          ["Selisih transaksi", income - expense],
        ].map(([label, amount], i) => (
          <div key={label} className="panel py-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <CurrencyDisplay
              amount={Number(amount)}
              className={`mt-2 block text-2xl font-semibold ${i === 0 ? "text-success" : i === 1 ? "text-destructive" : ""}`}
            />
            <p className="mt-2 text-[10px] text-muted-foreground">
              Sesuai filter & akses dompet Anda
            </p>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search
              className="absolute left-3 top-3 text-muted-foreground"
              size={16}
            />
            <Input
              aria-label="Cari transaksi"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari catatan transaksi…"
              className="h-10 pl-10"
            />
          </div>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal size={15} />
            {transactions.length} transaksi
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setCategory("");
              setMember("");
              setWallet("");
              setStart("");
              setEnd("");
              setType("");
              setPage(1);
            }}
          >
            <X size={13} />
            Reset filter
          </Button>
        </div>
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <label className="field text-xs">
            Dari tanggal
            <Input
              type="date"
              value={start}
              max={end || undefined}
              onChange={(e) => {
                setStart(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="field text-xs">
            Sampai tanggal
            <Input
              type="date"
              value={end}
              min={start || undefined}
              onChange={(e) => {
                setEnd(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="field text-xs">
            Jenis
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua jenis</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
              <option value="transfer">Transfer</option>
            </select>
          </label>
          <label className="field text-xs">
            Kategori
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua kategori</option>
              {data.categories
                .filter((c) => c.familyId === familyId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="field text-xs">
            Anggota
            <select
              value={member}
              onChange={(e) => {
                setMember(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua anggota</option>
              {data.users
                .filter((u) => u.familyId === familyId)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="field text-xs">
            Dompet
            <select
              value={wallet}
              onChange={(e) => {
                setWallet(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua dompet</option>
              {visibleWallets(data, familyId, user.id).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {start && end && start > end ? (
          <p role="alert" className="text-sm text-destructive">
            Tanggal akhir harus sesudah tanggal awal.
          </p>
        ) : (
          <TransactionTable
            transactions={transactions.slice(
              (currentPage - 1) * 8,
              currentPage * 8,
            )}
          />
        )}
        <div className="mt-5 flex items-center justify-between border-t pt-4">
          <span className="text-[11px] text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
