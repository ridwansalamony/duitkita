"use client";
import Image from "next/image";
import { insufficientWallet } from "@/lib/workspace/funds";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  UploadCloud,
  LoaderCircle,
  ScanLine,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { RequestForm } from "@/components/ui/request-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { BudgetProgress } from "@/components/shared/budget-progress";
import { categoryBudget } from "@/lib/workspace/budget";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeading } from "@/components/shared/common";
import {
  useDemo,
  visibleWallets,
  visibleTransactions,
  walletBalance,
  primaryWallet,
} from "@/lib/dummy/store";
import { DEMO_TODAY, type Transaction, type TxType } from "@/lib/dummy/data";
import { rupiah } from "@/lib/utils";
import { isDemo, today } from "@/lib/mode";
import { resizeReceipt } from "@/lib/receipts/image";
import { recognizeReceipt } from "@/lib/receipts/ocr";
import type { ReceiptSuggestion } from "@/lib/receipts/parse";
export function TransactionEditor({
  initial,
  onDone,
  transferTo,
}: {
  initial?: Transaction;
  transferTo?: string;
  onDone?: () => void;
}) {
  const { data, user, familyId, update, log } = useDemo();
  const router = useRouter();
  const wallets = visibleWallets(data, familyId, user.id);
  const [type, setType] = useState<TxType>(
    initial?.type ?? (transferTo ? "transfer" : "expense"),
  );
  const [amount, setAmount] = useState(initial?.amount.toString() ?? "");
  const [date, setDate] = useState(initial?.date ?? today());
  const [description, setDescription] = useState(initial?.description ?? "");
  const [wallet, setWallet] = useState(
    initial?.walletId ??
      primaryWallet(data, familyId)?.id ??
      wallets[0]?.id ??
      "",
  );
  const [toWallet, setToWallet] = useState(
    initial?.toWalletId ??
      (wallets.some((w) => w.id === transferTo) ? transferTo : ""),
  );
  const [category, setCategory] = useState(initial?.categoryId ?? "");
  const [receipt, setReceipt] = useState(initial?.receipt ?? "");
  const [receiptPath, setReceiptPath] = useState(initial?.receiptPath);
  const [receiptOcrData, setReceiptOcrData] = useState(initial?.receiptOcrData);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [fileName, setFileName] = useState(
    initial?.receipt ? "Struk terlampir" : "",
  );
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [ocr, setOcr] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [suggestion, setSuggestion] = useState<ReceiptSuggestion | null>(null);
  const [reading, setReading] = useState(false);
  const processing = useRef<AbortController | null>(null);
  const selectedCategory = data.categories.find(
    (c) => c.familyId === familyId && c.id === category,
  );
  const budget =
    type === "expense" && selectedCategory
      ? categoryBudget(
          selectedCategory,
          data.transactions,
          familyId,
          date.slice(0, 7),
          initial?.id,
        )
      : null;
  useEffect(
    () => () => {
      processing.current?.abort();
    },
    [],
  );

  async function attach(file?: File) {
    if (!file || processing.current || type !== "expense") return;
    if (
      !["image/jpeg", "image/png"].includes(file.type) ||
      !file.size ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Pilih foto JPG atau PNG berukuran maksimal 5 MB.");
      return;
    }
    const controller = new AbortController();
    processing.current = controller;
    setUploading(true);
    setUploadStatus("Menyiapkan foto…");
    setError("");
    setSuggestion(null);
    try {
      const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      const valid =
        file.type === "image/jpeg"
          ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
          : [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b);
      if (!valid)
        throw new Error(
          "Isi file tidak sesuai format JPG/PNG. Pilih foto yang valid.",
        );
      const image = await resizeReceipt(file);
      if (controller.signal.aborted) return;
      let path: string | undefined;
      let url: string;
      if (isDemo) {
        url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () =>
            reject(new Error("Foto belum dapat dibaca. Coba pilih ulang."));
          reader.readAsDataURL(image);
        });
      } else {
        const form = new FormData();
        form.set("file", image);
        setUploadStatus("Mengunggah struk…");
        const response = await fetch("/api/ocr/pratinjau", {
          method: "POST",
          body: form,
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            "Unggah struk belum berhasil. Coba kembali atau isi transaksi tanpa struk.",
          );
        const events = (await response.text())
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line));
        const result = events.find(
          (event) => event.done && event.path && event.url,
        );
        if (!result)
          throw new Error(
            "Struk belum terunggah. Coba kembali atau isi transaksi tanpa struk.",
          );
        path = result.path;
        url = result.url;
      }
      if (controller.signal.aborted) return;
      setReceipt(url);
      setReceiptPath(path);
      setFileName(file.name);
      setReceiptOcrData(undefined);
      setOcr(false);
      setReading(true);
      try {
        const result = await recognizeReceipt(
          image,
          controller.signal,
          (status) => {
            if (processing.current === controller) setUploadStatus(status);
          },
        );
        if (controller.signal.aborted) return;
        if (result.total || result.date || result.merchant) {
          setSuggestion(result);
          setReceiptOcrData(result);
          setUploadStatus(
            "Struk terbaca. Periksa saran di bawah sebelum menggunakannya.",
          );
        } else {
          setUploadStatus(
            "Tulisan belum terbaca dengan jelas. Foto tetap terlampir; isi transaksi secara manual.",
          );
        }
      } catch {
        if (processing.current !== controller) return;
        setUploadStatus(
          controller.signal.aborted
            ? "Pembacaan dihentikan. Foto tetap terlampir; isi transaksi secara manual."
            : "Pembacaan otomatis belum berhasil. Foto tetap terlampir; isi transaksi secara manual atau coba foto yang lebih jelas.",
        );
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(
          error instanceof Error ? error.message : "Foto belum dapat diproses.",
        );
        setUploadStatus(
          "Foto belum diproses. Anda tetap dapat mengisi transaksi secara manual.",
        );
      }
    } finally {
      if (processing.current === controller) {
        processing.current = null;
        setUploading(false);
        setReading(false);
        if (fileInput.current) fileInput.current.value = "";
      }
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (uploading) return;
    setError("");
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0 || n > 9999999999999.99) {
      setError(
        "Nominal harus lebih dari Rp0 dan maksimal 13 digit sebelum desimal.",
      );
      return;
    }
    if (!wallets.some((w) => w.id === wallet)) {
      setError("Pilih dompet yang dapat Anda akses.");
      return;
    }
    if (
      type === "transfer" &&
      (!toWallet ||
        toWallet === wallet ||
        !wallets.some((w) => w.id === toWallet))
    ) {
      setError("Dompet tujuan harus berbeda dan dapat Anda akses.");
      return;
    }
    if (
      type !== "transfer" &&
      !data.categories.some(
        (c) => c.id === category && c.familyId === familyId && c.type === type,
      )
    ) {
      setError("Pilih kategori sesuai jenis transaksi.");
      return;
    }
    if (
      initial &&
      !visibleTransactions(data, familyId, user.id).some(
        (t) => t.id === initial.id,
      )
    ) {
      setError("Transaksi ini tidak dapat Anda ubah.");
      return;
    }
    const id = initial?.id ?? crypto.randomUUID();
    const tx: Transaction = {
      id,
      familyId,
      userId: initial?.userId ?? user.id,
      walletId: wallet,
      toWalletId: type === "transfer" ? toWallet : undefined,
      categoryId: type === "transfer" ? "" : category,
      type,
      amount: n,
      description:
        type === "transfer"
          ? "Transfer antar dompet"
          : description.trim() ||
            {
              income: "Pemasukan keluarga",
              expense: "Pengeluaran keluarga",
              transfer: "Transfer antar dompet",
            }[type],
      date,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      receipt: type === "expense" ? receipt || undefined : undefined,
      receiptPath: type === "expense" ? receiptPath : undefined,
      receiptOcrData: type === "expense" ? receiptOcrData : undefined,
    };
    const blocked = insufficientWallet(
      Object.fromEntries(
        wallets.map((w) => [w.id, walletBalance(data, familyId, w.id)]),
      ),
      initial,
      tx,
    );
    if (blocked) {
      setError(
        `Saldo ${wallets.find((w) => w.id === blocked)?.name ?? "dompet"} belum mencukupi. Perubahan ini akan membuat saldo minus. Kurangi nominal atau pilih dompet lain.`,
      );
      return;
    }
    const owner =
      wallets.find((w) => w.id === wallet)?.ownerUserId ??
      wallets.find((w) => w.id === toWallet)?.ownerUserId ??
      undefined;
    if (
      !(await update((d) => ({
        ...d,
        transactions: initial
          ? d.transactions.map((t) =>
              t.id === id && t.familyId === familyId ? tx : t,
            )
          : [tx, ...d.transactions],
        logs: log(
          d,
          initial ? "update" : "create",
          "Transaksi",
          id,
          `${initial ? "Mengubah" : "Mencatat"} ${tx.description}: ${initial ? `${rupiah(initial.amount)} → ` : ""}${rupiah(n)}`,
          owner,
        ),
      })))
    )
      return;
    toast.success(
      initial
        ? isDemo
          ? "Perubahan transaksi disimpan di sesi demo"
          : "Perubahan transaksi tersimpan"
        : "Transaksi tercatat. Catat dulu, biar tenang.",
    );
    if (onDone) onDone();
    else router.push(`/transaksi/${id}`);
  }
  return (
    <>
      <Link
        href="/transaksi"
        className="mb-5 inline-flex items-center gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft size={14} />
        Kembali ke transaksi
      </Link>
      <PageHeading
        title={initial ? "Ubah catatan transaksi" : "Catat dulu, biar tenang."}
        description="Pemasukan kecil atau belanja besar, semuanya berarti untuk rencana kita."
      />
      <RequestForm
        onSubmit={submit}
        className={`grid items-start gap-6 ${type === "expense" ? "xl:grid-cols-[1.35fr_1fr]" : "mx-auto max-w-3xl"}`}
      >
        <section className="panel">
          <Tabs
            value={type}
            onValueChange={(v) => {
              setType(v as TxType);
              setCategory("");
              setError("");
              if (v !== "expense") {
                processing.current?.abort();
                processing.current = null;
                setUploading(false);
                setReading(false);
                setReceipt("");
                setReceiptPath(undefined);
                setReceiptOcrData(undefined);
                setSuggestion(null);
                setOcr(false);
                setUploadStatus("");
                setFileName("");
                setDragging(false);
              }
              if (v === "transfer") setDescription("");
            }}
          >
            <TabsList className="mb-7 grid h-11 w-full grid-cols-3">
              <TabsTrigger value="income">Pemasukan</TabsTrigger>
              <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
            </TabsList>
          </Tabs>
          <label className="field">
            Nominal transaksi
            <span className="relative">
              <span className="absolute left-4 top-4 text-xl font-semibold text-muted-foreground">
                Rp
              </span>
              <CurrencyInput
                name="amount"
                aria-label="Nominal transaksi"
                required
                value={amount}
                onValueChange={setAmount}
                placeholder="0"
                className="number h-16 pl-14 text-3xl font-semibold md:text-3xl"
              />
            </span>
          </label>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="field">
              {type === "income" ? "Masuk ke dompet" : "Dompet sumber"}
              <select
                aria-label={
                  type === "income" ? "Masuk ke dompet" : "Dompet sumber"
                }
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                required
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <span className="text-[11px] font-normal text-muted-foreground">
                Saldo: {rupiah(walletBalance(data, familyId, wallet))}
              </span>
            </label>
            {type === "transfer" ? (
              <label className="field">
                Dompet tujuan
                <select
                  aria-label="Dompet tujuan"
                  required
                  value={toWallet}
                  onChange={(e) => setToWallet(e.target.value)}
                >
                  <option value="">Pilih dompet tujuan</option>
                  {wallets
                    .filter((w) => w.id !== wallet)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </label>
            ) : (
              <label className="field">
                Kategori
                <select
                  aria-label="Kategori"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Pilih kategori</option>
                  {data.categories
                    .filter((c) => c.familyId === familyId && c.type === type)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <label className="field">
              Tanggal
              <Input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="field">
              Dicatat oleh
              <Input
                value={
                  data.users.find(
                    (u) =>
                      u.id === (initial?.userId ?? user.id) &&
                      u.familyId === familyId,
                  )?.name ?? user.name
                }
                readOnly
                className="bg-muted"
              />
            </label>
          </div>
          {budget && (
            <div className="mt-5 rounded-xl border p-4" aria-live="polite">
              <BudgetProgress
                limit={budget.limit}
                spent={budget.spent + (Number(amount) || 0)}
                title={`Perkiraan budget ${selectedCategory?.name} · ${date.slice(0, 7)}`}
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Termasuk nominal ini jika disimpan. Budget adalah pengingat;
                pengeluaran tetap dapat dicatat selama saldo cukup.
              </p>
            </div>
          )}
          {type !== "transfer" && (
            <label className="field mt-5">
              Catatan <span className="sr-only">transaksi</span>
              <textarea
                aria-label="Catatan transaksi"
                rows={3}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Belanja sayur dan buah untuk seminggu"
              />
              <span className="text-[11px] font-normal text-muted-foreground">
                Opsional · bantu Anda mengingat cerita di balik transaksi ini.
              </span>
            </label>
          )}
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <div className="mt-7 flex justify-end gap-3 border-t pt-5">
            {onDone ? (
              <Button type="button" variant="outline" onClick={onDone}>
                Batal
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/transaksi">Batal</Link>
              </Button>
            )}
            <Button
              disabled={uploading}
              className="gradient-button"
              type="submit"
            >
              <Check size={16} />
              {initial ? "Simpan Perubahan" : "Simpan Transaksi"}
            </Button>
          </div>
        </section>
        {type === "expense" && (
          <aside className="space-y-5">
            <div className="panel">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold">Bukti belanja</h2>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">
                  Opsional
                </span>
              </div>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Simpan foto struk sebagai pengingat. Transaksi tetap bisa
                dicatat tanpa struk.
              </p>
              <input
                disabled={uploading}
                ref={fileInput}
                aria-label="Pilih foto struk"
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                onChange={(e) => void attach(e.target.files?.[0])}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  void attach(e.dataTransfer.files[0]);
                }}
                className={`mt-5 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition-colors ${dragging ? "border-primary bg-secondary" : "border-border bg-canvas hover:border-primary/50"}`}
              >
                {uploading ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="mb-3 animate-spin text-primary"
                    size={28}
                  />
                ) : (
                  <UploadCloud className="mb-3 text-primary" size={28} />
                )}
                <span className="text-sm font-medium">
                  {uploading ? "Memproses struk…" : "Tarik foto struk ke sini"}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  atau klik untuk memilih foto
                </span>
                <span className="mt-4 text-[10px] text-muted-foreground">
                  JPG atau PNG · maksimal 5 MB
                </span>
              </button>
              {receipt && (
                <div className="mt-4 rounded-xl border p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="truncate text-xs">{fileName}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Hapus lampiran struk"
                      disabled={uploading}
                      onClick={() => {
                        setReceipt("");
                        setReceiptPath(undefined);
                        setReceiptOcrData(undefined);
                        setFileName("");
                        setOcr(false);
                        setSuggestion(null);
                        setUploadStatus("");
                        if (fileInput.current) fileInput.current.value = "";
                      }}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  <Image
                    src={receipt}
                    alt="Pratinjau lampiran struk"
                    width={360}
                    height={420}
                    className="max-h-64 w-full rounded-lg object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-primary/15 bg-secondary/40 p-5 text-sm">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <ScanLine size={17} className="text-primary" />
                Baca struk otomatis
              </h3>
              <p role="status" className="text-xs leading-6">
                {uploadStatus ||
                  "Pilih foto struk untuk membaca nominal, tanggal, dan nama toko. Pembacaan berlangsung di perangkat Anda, tanpa biaya API OCR."}
              </p>
              {reading && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() => processing.current?.abort()}
                >
                  Hentikan pembacaan
                </Button>
              )}
              {suggestion && (
                <div className="mt-4 rounded-xl border bg-card p-4 text-xs">
                  <p className="font-semibold">Saran dari foto struk</p>
                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    <dt>Nama toko</dt>
                    <dd className="text-right">
                      {suggestion.merchant || "Belum terbaca"}
                    </dd>
                    <dt>Total</dt>
                    <dd className="text-right">
                      {suggestion.total
                        ? rupiah(suggestion.total)
                        : "Belum terbaca"}
                    </dd>
                    <dt>Tanggal</dt>
                    <dd className="text-right">
                      {suggestion.date || "Belum terbaca"}
                    </dd>
                  </dl>
                  <Button
                    type="button"
                    className="mt-4 w-full"
                    size="sm"
                    onClick={() => {
                      if (suggestion.total) setAmount(String(suggestion.total));
                      if (suggestion.date) setDate(suggestion.date);
                      if (suggestion.merchant)
                        setDescription(suggestion.merchant);
                      setSuggestion(null);
                      setUploadStatus(
                        "Saran diisikan. Periksa kembali nominal, tanggal, dan catatan sebelum menyimpan.",
                      );
                    }}
                  >
                    Gunakan Saran <ArrowRight size={14} />
                  </Button>
                </div>
              )}
            </div>
            {isDemo && (
              <div className="rounded-2xl border border-primary/15 bg-secondary/40 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <ScanLine size={17} className="text-primary" />
                  Contoh pembacaan struk
                </h3>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  Coba contoh hasil pembacaan struk Sate Padang Ajo tanpa
                  memilih foto. Foto yang Anda pilih sendiri akan dibaca
                  langsung di perangkat.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full bg-card text-xs"
                  onClick={() => {
                    setOcr(true);
                  }}
                >
                  Tampilkan Contoh Hasil OCR
                </Button>
                {ocr && (
                  <div className="mt-4 rounded-xl border bg-card p-4 text-xs">
                    <p className="font-semibold">
                      Contoh hasil · Sate Padang Ajo
                    </p>
                    <dl className="mt-3 grid grid-cols-2 gap-2">
                      <dt className="text-muted-foreground">Total</dt>
                      <dd className="text-right">Rp87.500</dd>
                      <dt className="text-muted-foreground">Tanggal</dt>
                      <dd className="text-right">30 September 2026</dd>
                    </dl>
                    <Button
                      type="button"
                      className="mt-4 w-full"
                      size="sm"
                      onClick={() => {
                        setAmount("87500");
                        setDate(DEMO_TODAY);
                        setDescription("Makan malam di Sate Padang Ajo");
                        setType("expense");
                        setCategory("makan");
                        if (!receipt) {
                          setReceipt("/receipts/sate-padang.svg");
                          setFileName("Contoh struk Sate Padang Ajo");
                        }
                        toast.success(
                          "Contoh diisikan. Periksa kembali sebelum menyimpan.",
                        );
                      }}
                    >
                      Gunakan Contoh <ArrowRight size={14} />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </RequestForm>
    </>
  );
}
