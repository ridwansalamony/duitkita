"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { RequestForm } from "@/components/ui/request-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { BudgetProgress } from "@/components/shared/budget-progress";
import { categoryBudget } from "@/lib/workspace/budget";
import { today } from "@/lib/mode";
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
  EmptyState,
  Reveal,
} from "@/components/shared/common";
import { useDemo } from "@/lib/dummy/store";
import type { Category } from "@/lib/dummy/data";
export function CategoriesPage() {
  const { data, familyId, update, log } = useDemo();
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState<Category | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("expense");
  const [formType, setFormType] = useState("expense");
  const [month, setMonth] = useState(today().slice(0, 7));
  const categories = data.categories.filter(
    (c) =>
      c.familyId === familyId &&
      c.type === type &&
      c.name.toLowerCase().includes(search.toLowerCase()),
  );
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    const kind = String(f.get("type")) as Category["type"];
    const budget =
      kind === "expense" ? String(f.get("monthlyBudget") ?? "") : "";
    if (
      budget &&
      (!Number.isFinite(Number(budget)) ||
        Number(budget) <= 0 ||
        Number(budget) > 9999999999999.99)
    ) {
      setError(
        "Budget harus lebih dari Rp0 dan maksimal 13 digit sebelum desimal. Kosongkan jika tidak dibatasi.",
      );
      return;
    }
    if (!name) {
      setError("Isi nama kategori terlebih dahulu.");
      return;
    }
    if (
      data.categories.some(
        (c) =>
          c.familyId === familyId &&
          c.type === kind &&
          c.name.toLowerCase() === name.toLowerCase() &&
          c.id !== editing?.id,
      )
    ) {
      setError("Nama kategori sudah digunakan untuk jenis ini.");
      return;
    }
    const cat: Category = {
      id: editing?.id ?? crypto.randomUUID(),
      familyId,
      name,
      type: kind,
      icon: String(f.get("icon")),
      color: String(f.get("color")),
      monthlyBudget: budget ? Number(budget) : undefined,
    };
    if (
      !(await update((d) => ({
        ...d,
        categories: editing
          ? d.categories.map((c) =>
              c.id === cat.id && c.familyId === familyId ? cat : c,
            )
          : [...d.categories, cat],
        logs: log(
          d,
          editing ? "update" : "create",
          "Kategori",
          cat.id,
          `${editing ? "Mengubah" : "Membuat"} kategori ${cat.name}`,
        ),
      })))
    )
      return;
    setOpen(false);
    toast.success("Kategori disimpan");
  }
  async function del() {
    if (!remove) return;
    if (
      !(await update((d) => {
        const fallback = d.categories.find(
          (c) =>
            c.familyId === familyId &&
            c.type === remove.type &&
            c.name === "Lainnya",
        ) ?? {
          id: crypto.randomUUID(),
          familyId,
          name: "Lainnya",
          type: remove.type,
          color: "#64748b",
          icon: "tag",
        };
        const cats = d.categories.filter(
          (c) => !(c.familyId === familyId && c.id === remove.id),
        );
        if (!cats.some((c) => c.id === fallback.id)) cats.push(fallback);
        return {
          ...d,
          categories: cats,
          transactions: d.transactions.map((t) =>
            t.familyId === familyId && t.categoryId === remove.id
              ? { ...t, categoryId: fallback.id }
              : t,
          ),
          logs: log(
            d,
            "delete",
            "Kategori",
            remove.id,
            `Menghapus kategori ${remove.name}; transaksi dipindahkan ke Lainnya`,
          ),
        };
      }))
    )
      return;
    setRemove(null);
    toast.success("Kategori dihapus. Catatan terkait dipindahkan ke Lainnya.");
  }
  return (
    <Reveal>
      <PageHeading
        title="Beri nama setiap kebutuhan"
        description="Kategori yang rapi membuat kebiasaan keuangan lebih mudah dipahami."
        action={
          <Button
            className="gradient-button"
            onClick={() => {
              setEditing(null);
              setFormType(type);
              setError("");
              setOpen(true);
            }}
          >
            <Plus size={16} />
            Tambah Kategori
          </Button>
        }
      />
      <div className="panel">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b pb-5">
          <div>
            <h2 className="font-semibold">Budget bulanan keluarga</h2>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground">
              Atur batas pengeluaran lewat Ubah kategori. Batas yang sama
              berlaku setiap bulan; pemakaian dihitung ulang dari transaksi pada
              bulan pilihan. Mengubah batas juga mengubah pembanding bulan
              sebelumnya.
            </p>
          </div>
          <label className="field">
            Bulan pemakaian
            <Input
              type="month"
              aria-label="Bulan pemakaian"
              value={month}
              onChange={(e) => setMonth(e.target.value || today().slice(0, 7))}
            />
          </label>
        </div>
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div
            role="group"
            aria-label="Jenis kategori"
            className="flex rounded-xl bg-muted p-1"
          >
            {[
              ["expense", "Pengeluaran"],
              ["income", "Pemasukan"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={type === value}
                onClick={() => setType(value)}
                className={`rounded-lg px-5 py-2 text-xs font-medium ${type === value ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-3 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Cari kategori"
              placeholder="Cari kategori…"
              className="pl-9"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => {
            const budget = categoryBudget(
              c,
              data.transactions,
              familyId,
              month,
            );
            return (
              <div key={c.id} className="rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <FeatureIcon name={c.icon} color={c.color} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xs font-semibold">{c.name}</h2>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {c.type === "income" ? "Pemasukan" : "Pengeluaran"}
                    </p>
                  </div>
                  <div className="flex">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Ubah kategori ${c.name}`}
                      onClick={() => {
                        setEditing(c);
                        setFormType(c.type);
                        setError("");
                        setOpen(true);
                      }}
                    >
                      <Pencil size={13} />
                    </Button>
                    {c.name !== "Lainnya" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Hapus kategori ${c.name}`}
                        onClick={() => setRemove(c)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </div>
                </div>
                {c.type === "expense" && (
                  <div className="mt-4 border-t pt-4">
                    {budget ? (
                      <BudgetProgress
                        limit={budget.limit}
                        spent={budget.spent}
                        title={`Budget ${c.name}`}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Belum ada batas budget. Atur melalui tombol Ubah
                        kategori.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {!categories.length && (
          <EmptyState
            title="Kategori belum ditemukan"
            description="Coba kata kunci lain atau buat kategori yang sesuai kebutuhan Anda."
          />
        )}
        <p className="mt-6 text-xs leading-6 text-muted-foreground">
          Kategori dipakai bersama oleh anggota keluarga. Menghapus kategori
          akan memindahkan transaksi terkait ke “Lainnya”.
        </p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Ubah kategori" : "Kategori baru, catatan lebih rapi"}
            </DialogTitle>
            <DialogDescription>
              Pilih nama, ikon, dan warna yang mudah Anda kenali.
            </DialogDescription>
          </DialogHeader>
          <RequestForm onSubmit={save} className="space-y-4">
            <label className="field">
              Nama kategori
              <Input
                name="name"
                required
                maxLength={100}
                defaultValue={editing?.name}
                readOnly={editing?.name === "Lainnya"}
                placeholder="Contoh: Perawatan Rumah"
              />
            </label>
            <label className="field">
              Jenis
              <select
                name="type"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                disabled={!!editing}
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
              {editing && (
                <input type="hidden" name="type" value={editing.type} />
              )}
            </label>
            {formType === "expense" && (
              <label className="field">
                Maksimal budget bulanan (Rp)
                <CurrencyInput
                  name="monthlyBudget"
                  defaultValue={editing?.monthlyBudget}
                  placeholder="Contoh: 2.000.000"
                />
                <span className="text-xs font-normal text-muted-foreground">
                  Kosongkan untuk tanpa batas. Peringatan mulai 80%; budget
                  tidak melarang pencatatan pengeluaran.
                </span>
              </label>
            )}
            <div className="grid grid-cols-2 gap-4">
              <label className="field">
                Ikon
                <select name="icon" defaultValue={editing?.icon ?? "tag"}>
                  {[
                    ["tag", "Label"],
                    ["utensils", "Makanan"],
                    ["car", "Transportasi"],
                    ["shopping-bag", "Belanja"],
                    ["heart", "Kesehatan"],
                    ["home", "Rumah"],
                    ["briefcase", "Pekerjaan"],
                    ["gift", "Hadiah"],
                    ["graduation-cap", "Pendidikan"],
                    ["zap", "Tagihan"],
                  ].map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Warna
                <Input
                  type="color"
                  name="color"
                  defaultValue={editing?.color ?? "#7c3aed"}
                  className="h-11 p-1"
                />
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
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" className="gradient-button">
                Simpan Kategori
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
            <DialogTitle>Hapus kategori {remove?.name}?</DialogTitle>
            <DialogDescription>
              Transaksi tetap tersimpan dan berpindah ke kategori Lainnya dengan
              jenis yang sama.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemove(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={del}>
              Hapus Kategori
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Reveal>
  );
}
