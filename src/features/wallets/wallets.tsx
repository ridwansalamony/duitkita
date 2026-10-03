"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { RequestForm } from "@/components/ui/request-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  CurrencyDisplay,
  FeatureIcon,
  EmptyState,
  Reveal,
} from "@/components/shared/common";
import { useDemo, visibleWallets, walletBalance } from "@/lib/dummy/store";
import type { Wallet } from "@/lib/dummy/data";
export function WalletsPage() {
  const { data, user, familyId, update, log } = useDemo();
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState<Wallet | null>(null);
  const [error, setError] = useState("");
  const wallets = visibleWallets(data, familyId, user.id);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();

    if (!name) {
      setError("Nama dompet perlu diisi.");
      return;
    }

    if (
      wallets.some(
        (w) =>
          w.name.toLowerCase() === name.toLowerCase() && w.id !== editing?.id,
      )
    ) {
      setError("Nama dompet sudah digunakan. Pilih nama lain.");
      return;
    }
    const w: Wallet = {
      id: editing?.id ?? crypto.randomUUID(),
      familyId,
      name,
      type: "shared",
      ownerUserId: null,
      isPrimary: editing?.isPrimary ?? false,
      color: String(f.get("color")),
    };
    if (
      !(await update((d) => ({
        ...d,
        wallets: editing
          ? d.wallets.map((x) =>
              x.id === w.id && x.familyId === familyId ? w : x,
            )
          : [...d.wallets, w],
        logs: log(
          d,
          editing ? "update" : "create",
          "Dompet",
          w.id,
          `${editing ? "Mengubah" : "Membuat"} ${w.name}`,
          w.ownerUserId ?? undefined,
        ),
      })))
    )
      return;
    setOpen(false);
    toast.success("Dompet berhasil disimpan");
  }
  async function deleteWallet() {
    if (!remove) return;

    const used =
      data.transactions.some(
        (t) =>
          t.familyId === familyId &&
          (t.walletId === remove.id || t.toWalletId === remove.id),
      ) ||
      data.goals.some(
        (g) => g.familyId === familyId && g.walletId === remove.id,
      );
    if (used || remove.isPrimary) {
      setError(
        "Dompet utama, dompet dengan transaksi, atau dompet yang terhubung ke target tidak dapat dihapus.",
      );
      return;
    }
    if (
      !(await update((d) => ({
        ...d,
        wallets: d.wallets.filter(
          (w) => !(w.familyId === familyId && w.id === remove.id),
        ),
        logs: log(
          d,
          "delete",
          "Dompet",
          remove.id,
          `Menghapus ${remove.name}`,
          remove.ownerUserId ?? undefined,
        ),
      })))
    )
      return;
    setRemove(null);
    toast.success("Dompet dihapus");
  }
  return (
    <Reveal>
      <PageHeading
        title="Dompet untuk setiap kebutuhan"
        description="Satu keluarga, dompet bersama untuk kebutuhan sehari-hari dan impian kita."
        action={
          <Button
            className="gradient-button"
            onClick={() => {
              setEditing(null);
              setError("");
              setOpen(true);
            }}
          >
            <Plus size={16} />
            Tambah Dompet
          </Button>
        }
      />
      <div className="mb-8 flex items-start gap-3 rounded-2xl border bg-card p-5">
        <ShieldCheck className="shrink-0 text-primary" size={21} />
        <p className="text-sm leading-6 text-muted-foreground">
          Semua dompet dapat diakses Anda berdua. Dompet Keluarga menjadi
          pilihan utama transaksi. Transfer antar dompet memindahkan dana tanpa
          menambah pengeluaran keluarga.
        </p>
      </div>
      {(["shared"] as const).map((type) => (
        <section key={type} className="mb-9">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-bold">Dompet bersama</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {wallets.filter((w) => w.type === type).length}
            </span>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {wallets
              .filter((w) => w.type === type)
              .map((w) => (
                <article key={w.id} className="panel overflow-hidden">
                  <div className="flex items-center justify-between">
                    <FeatureIcon color={w.color} />
                    <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">
                      <Users size={11} /> {w.isPrimary ? "Utama" : "Bersama"}
                    </span>
                  </div>
                  <h3 className="mt-5 text-sm font-semibold">{w.name}</h3>
                  {data.goals
                    .filter(
                      (g) =>
                        g.familyId === familyId &&
                        g.walletId === w.id &&
                        g.status !== "archived",
                    )
                    .map((g) => (
                      <Link
                        className="mt-2 block text-xs text-primary"
                        key={g.id}
                        href={`/tabungan/${g.id}`}
                      >
                        Target: {g.name}
                      </Link>
                    ))}
                  <p className="mt-4 text-[10px] text-muted-foreground">
                    Saldo tersedia
                  </p>
                  <CurrencyDisplay
                    amount={walletBalance(data, familyId, w.id)}
                    className="mt-1 block text-[26px] font-semibold"
                  />
                  <div className="mt-5 flex items-center justify-between border-t pt-4">
                    <Link
                      href="/transaksi/baru"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                    >
                      Catat transaksi <ArrowRight size={13} />
                    </Link>
                    {
                      <div className="flex">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Ubah ${w.name}`}
                          onClick={() => {
                            setEditing(w);
                            setOpen(true);
                            setError("");
                          }}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={w.isPrimary}
                          aria-label={`Hapus ${w.name}`}
                          onClick={() => {
                            setRemove(w);
                            setError("");
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    }
                  </div>
                </article>
              ))}
          </div>
          {!wallets.some((w) => w.type === type) && (
            <EmptyState
              title="Dompet bersama keluarga"
              description="Tambahkan dompet untuk mengatur kebutuhan dan tabungan keluarga."
            />
          )}
        </section>
      ))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Ubah dompet" : "Ruang baru untuk uang Anda"}
            </DialogTitle>
            <DialogDescription>
              Saldo dihitung otomatis dari pemasukan, pengeluaran, dan transfer.
            </DialogDescription>
          </DialogHeader>
          <RequestForm onSubmit={save} className="space-y-5">
            <label className="field">
              Nama dompet
              <Input
                name="name"
                required
                maxLength={120}
                defaultValue={editing?.name ?? ""}
                placeholder="Contoh: Dana Liburan Keluarga"
              />
            </label>
            <label className="field">
              Warna dompet
              <Input
                name="color"
                type="color"
                defaultValue={editing?.color ?? "#7c3aed"}
                className="h-11 w-20 p-1"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button className="gradient-button" type="submit">
                Simpan Dompet
              </Button>
            </DialogFooter>
          </RequestForm>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!remove}
        onOpenChange={(v) => {
          if (!v) setRemove(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus {remove?.name}?</DialogTitle>
            <DialogDescription>
              Hanya dompet tambahan tanpa transaksi atau target yang dapat
              dihapus. Catatan keuangan keluarga tetap terjaga.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemove(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={deleteWallet}>
              Hapus Dompet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Reveal>
  );
}
