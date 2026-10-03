"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  Pencil,
  CalendarDays,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { RequestForm } from "@/components/ui/request-form";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PageHeading,
  FeatureIcon,
  CurrencyDisplay,
  EmptyState,
  Reveal,
} from "@/components/shared/common";
import {
  useDemo,
  goalAmount,
  visibleWallets,
  primaryWallet,
  walletBalance,
  newestTransactionFirst,
} from "@/lib/dummy/store";
import { type Goal } from "@/lib/dummy/data";
import { rupiah, tanggal } from "@/lib/utils";
function GoalEditor({
  goal,
  open,
  onOpenChange,
}: {
  goal?: Goal;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data, user, familyId, update, log } = useDemo();
  const wallets = visibleWallets(data, familyId, user.id);
  const available = wallets.filter(
    (w) =>
      w.id === goal?.walletId ||
      !data.goals.some(
        (g) =>
          g.familyId === familyId && g.id !== goal?.id && g.walletId === w.id,
      ),
  );
  const [error, setError] = useState("");
  const [selectedWallet, setSelectedWallet] = useState(goal?.walletId ?? "");
  useEffect(() => {
    if (open) {
      setSelectedWallet(goal?.walletId ?? "");
      setError("");
    }
  }, [open, goal?.walletId]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    const target = Number(f.get("target"));
    if (
      !name ||
      !Number.isFinite(target) ||
      target <= 0 ||
      target > 9999999999999.99
    ) {
      setError("Isi nama dan target yang valid.");
      return;
    }
    const walletId = String(f.get("walletId"));
    if (!available.some((w) => w.id === walletId)) {
      setError("Pilih dompet yang belum terhubung ke target lain.");
      return;
    }
    const amount = walletBalance(data, familyId, walletId);
    const g: Goal = {
      id: goal?.id ?? crypto.randomUUID(),
      familyId,
      walletId,
      name,
      target,
      deadline: String(f.get("deadline")),
      icon: String(f.get("icon")),
      status: amount >= target ? "achieved" : "active",
    };
    if (
      !(await update((d) => ({
        ...d,
        goals: goal
          ? d.goals.map((x) =>
              x.id === g.id && x.familyId === familyId ? g : x,
            )
          : [...d.goals, g],
        logs: log(
          d,
          goal ? "update" : "create",
          "Target Tabungan",
          g.id,
          `${goal ? "Mengubah" : "Membuat"} target ${name}`,
        ),
      })))
    )
      return;
    toast.success("Target tabungan disimpan");
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {goal ? "Ubah rencana kita" : "Impian apa yang ingin diwujudkan?"}
          </DialogTitle>
          <DialogDescription>
            Hubungkan dompet keluarga. Progres otomatis mengikuti saldonya.
          </DialogDescription>
        </DialogHeader>
        <RequestForm onSubmit={submit} className="space-y-5">
          <label className="field">
            Nama target
            <Input
              name="name"
              required
              maxLength={150}
              defaultValue={goal?.name}
              placeholder="Contoh: Renovasi Dapur"
            />
          </label>
          <label className="field">
            Target tabungan (Rp)
            <CurrencyInput
              name="target"
              required
              defaultValue={goal?.target}
              placeholder="15.000.000"
            />
          </label>
          <label className="field">
            Dompet tabungan
            <select
              aria-label="Dompet tabungan"
              name="walletId"
              required
              value={selectedWallet}
              onChange={(event) => setSelectedWallet(event.target.value)}
            >
              <option value="" disabled>
                Pilih dompet untuk target ini
              </option>
              {wallets
                .filter((w) => available.some((a) => a.id === w.id))
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
            </select>
          </label>
          <p className="text-xs text-muted-foreground">
            Satu dompet hanya dapat terhubung ke satu target.{" "}
            <Link href="/dompet" className="text-primary underline">
              Tambah dompet
            </Link>{" "}
            jika diperlukan.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <label className="field">
              Tanggal target
              <Input
                name="deadline"
                type="date"
                defaultValue={goal?.deadline ?? "2027-12-31"}
              />
            </label>
            <label className="field">
              Ikon
              <select name="icon" defaultValue={goal?.icon ?? "home"}>
                <option value="home">Rumah</option>
                <option value="car">Kendaraan</option>
                <option value="plane">Liburan</option>
                <option value="graduation-cap">Pendidikan</option>
                <option value="heart">Keluarga</option>
                <option value="wallet">Tabungan</option>
              </select>
            </label>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" className="gradient-button">
              Simpan Target
            </Button>
          </DialogFooter>
        </RequestForm>
      </DialogContent>
    </Dialog>
  );
}
export function GoalsPage() {
  const { data, familyId } = useDemo();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("active");
  const all = data.goals.filter(
    (g) => g.familyId === familyId && g.status !== "archived",
  );
  const goals = all.filter((g) => filter === "all" || g.status === filter);
  const saved = all
    .filter((g) => g.status !== "archived")
    .reduce((s, g) => s + goalAmount(data, familyId, g.id), 0);
  return (
    <Reveal>
      <PageHeading
        title="Impian besar, langkah bersama."
        description="Rumah pertama, liburan berdua, atau masa depan si kecil. Semuanya dimulai dari sini."
        action={
          <Button className="gradient-button" onClick={() => setOpen(true)}>
            <Plus size={16} />
            Buat Target
          </Button>
        }
      />
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <div className="panel bg-[#261441] text-white">
          <p className="text-xs text-purple-200">Total tabungan impian</p>
          <CurrencyDisplay
            amount={saved}
            className="mt-3 block text-3xl font-semibold"
          />
          <p className="mt-3 text-[10px] text-purple-200/70">
            Hasil langkah kecil Anda berdua
          </p>
        </div>
        <div className="panel">
          <p className="text-xs text-muted-foreground">
            Impian yang sedang diperjuangkan
          </p>
          <p className="number mt-3 text-3xl font-semibold">
            {all.filter((g) => g.status === "active").length}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              target
            </span>
          </p>
          <p className="mt-3 text-[10px] text-muted-foreground">
            Satu per satu, kita wujudkan
          </p>
        </div>
        <div className="panel">
          <p className="text-xs text-muted-foreground">
            Impian yang sudah tercapai
          </p>
          <p className="number mt-3 text-3xl font-semibold text-success">
            {all.filter((g) => g.status === "achieved").length}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              target
            </span>
          </p>
          <p className="mt-3 text-[10px] text-muted-foreground">
            Setiap pencapaian layak dirayakan
          </p>
        </div>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ["active", "Sedang ditabung"],
          ["achieved", "Tercapai"],
          ["all", "Semua"],
        ].map(([v, l]) => (
          <Button
            key={v}
            size="sm"
            variant={filter === v ? "secondary" : "ghost"}
            onClick={() => setFilter(v)}
          >
            {l}
          </Button>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((g, i) => {
          const amount = goalAmount(data, familyId, g.id);
          const pct = Math.round((amount / g.target) * 100);
          return (
            <article className="panel" key={g.id}>
              <div className="flex items-center justify-between">
                <FeatureIcon
                  name={g.icon}
                  color={["#f59e0b", "#0d9488", "#8b5cf6"][i % 3]}
                  className="size-14"
                />
                <span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">
                  {g.status === "achieved" ? "Tercapai 🎉" : "Sedang ditabung"}
                </span>
              </div>
              <h2 className="mt-6 text-xl font-bold">
                <Link href={`/tabungan/${g.id}`}>{g.name}</Link>
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                {
                  data.wallets.find(
                    (w) => w.familyId === familyId && w.id === g.walletId,
                  )?.name
                }
              </p>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    Sudah terkumpul
                  </p>
                  <CurrencyDisplay
                    amount={amount}
                    className="mt-1 block text-xl font-semibold"
                  />
                </div>
                <span className="text-sm font-semibold text-primary">
                  {pct}%
                </span>
              </div>
              <Progress
                value={Math.max(0, Math.min(pct, 100))}
                className="mt-4 h-2"
              />
              <p className="mt-3 text-xs text-muted-foreground">
                dari target {rupiah(g.target)}
              </p>
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <CalendarDays size={13} />
                  {g.deadline ? tanggal(g.deadline, true) : "Tanpa tenggat"}
                </span>
                <Link
                  href={`/tabungan/${g.id}`}
                  className="flex items-center gap-1 text-xs font-medium text-primary"
                >
                  Lihat <ArrowRight size={13} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {!goals.length && (
        <EmptyState
          title={
            filter === "achieved"
              ? "Cerita sukses sedang ditulis"
              : "Belum ada target di sini"
          }
          description="Terus sisihkan sedikit demi sedikit. Impian yang tercapai akan muncul pada pilihan Tercapai."
        />
      )}
      <GoalEditor open={open} onOpenChange={setOpen} />
    </Reveal>
  );
}
export function GoalDetail({ id }: { id: string }) {
  const { data, user, familyId } = useDemo();
  const [edit, setEdit] = useState(false);
  const goal = data.goals.find(
    (g) => g.familyId === familyId && g.id === id && g.status !== "archived",
  );
  if (!goal)
    return (
      <EmptyState
        title="Target tidak ditemukan"
        description="Target ini tidak tersedia di ruang keluarga Anda."
        href="/tabungan"
        cta="Lihat target tabungan"
      />
    );
  const amount = goalAmount(data, familyId, id);
  const pct = Math.round((amount / goal.target) * 100);
  const wallets = visibleWallets(data, familyId, user.id);
  const wallet = wallets.find((w) => w.id === goal.walletId);
  const main = primaryWallet(data, familyId);
  const history = data.transactions
    .filter(
      (t) =>
        t.familyId === familyId &&
        (t.walletId === goal.walletId || t.toWalletId === goal.walletId),
    )
    .sort(newestTransactionFirst);
  return (
    <Reveal>
      <Link
        href="/tabungan"
        className="mb-5 inline-flex items-center gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft size={14} />
        Semua impian
      </Link>
      <PageHeading
        title={goal.name}
        description="Satu tabungan keluarga, bertumbuh dari saldo dompet bersama."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEdit(true)}>
              <Pencil size={14} />
              Ubah
            </Button>
          </div>
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <section className="panel">
            <FeatureIcon name={goal.icon} className="size-16" color="#f59e0b" />
            <p className="mt-6 text-xs text-muted-foreground">
              Saldo {wallet?.name}
            </p>
            <CurrencyDisplay
              amount={amount}
              className="mt-2 block text-4xl font-semibold"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              dari {rupiah(goal.target)}
            </p>
            <div className="mt-6 flex justify-between text-xs">
              <span>{pct}% tercapai</span>
              <span className="text-muted-foreground">
                Sisa {rupiah(Math.max(0, goal.target - amount))}
              </span>
            </div>
            <Progress
              value={Math.max(0, Math.min(pct, 100))}
              className="mt-3 h-3"
            />
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays size={15} />
              Target:{" "}
              {goal.deadline ? tanggal(goal.deadline, true) : "Tanpa tenggat"}
            </div>
            <>
              {goal.status === "achieved" && (
                <p className="mt-6 flex items-center gap-2 rounded-xl bg-success-surface p-4 text-sm text-success">
                  <CheckCircle2 size={18} />
                  Impian ini sudah tercapai. Selamat!
                </p>
              )}
              <Button asChild className="gradient-button mt-7 w-full">
                <Link href={`/transaksi/baru?tujuan=${goal.walletId}`}>
                  <Plus size={16} />
                  Transfer ke Tabungan
                </Link>
              </Button>
            </>
          </section>
          <section className="panel">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Wallet size={16} />
              Dompet terhubung
            </h2>
            <p className="mt-4 font-semibold">{wallet?.name}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Transfer dari {main?.name ?? "Dompet Keluarga"} atau dompet lain
              akan langsung menambah tabungan ini. Pengeluaran dan transfer
              keluar mengurangi progres. Saldo yang sama tetap dihitung sekali
              dalam total keluarga.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/dompet">
                Lihat dompet <ArrowRight size={14} />
              </Link>
            </Button>
          </section>
        </div>
        <section className="panel">
          <h2 className="text-base font-bold">Riwayat dompet tabungan</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            {history.length} transaksi · saldo bersama seluruh keluarga
          </p>
          <div className="mt-7 space-y-6">
            {history.map((t) => {
              const incoming =
                t.toWalletId === goal.walletId ||
                (t.walletId === goal.walletId && t.type === "income");
              return (
                <Link
                  key={t.id}
                  href={`/transaksi/${t.id}`}
                  className="flex gap-4 border-b pb-6 last:border-0 last:pb-0"
                >
                  <FeatureIcon
                    name="wallet"
                    color={incoming ? "#0d9488" : "#f43f5e"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {t.description ||
                          (incoming ? "Dana masuk" : "Dana keluar")}
                      </p>
                      <CurrencyDisplay
                        amount={t.amount}
                        type={incoming ? "income" : "expense"}
                        className="text-sm font-semibold"
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {tanggal(t.date, true)} ·{" "}
                      {t.type === "transfer"
                        ? `${wallets.find((w) => w.id === t.walletId)?.name} → ${wallets.find((w) => w.id === t.toWalletId)?.name}`
                        : incoming
                          ? "Pemasukan"
                          : "Pengeluaran"}
                    </p>
                  </div>
                </Link>
              );
            })}
            {!history.length && (
              <EmptyState
                title="Mulai langkah pertama"
                description="Transfer ke dompet ini untuk mulai mengisi tabungan keluarga."
              />
            )}
          </div>
        </section>
      </div>
      <GoalEditor goal={goal} open={edit} onOpenChange={setEdit} />
    </Reveal>
  );
}
