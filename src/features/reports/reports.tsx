"use client";
import { isDemo, today, monthStart, daysAgo } from "@/lib/mode";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  aggregateReport,
  demoReport,
  reportFilter,
  type FinancialReport,
} from "@/lib/reports";
import {
  Download,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  PageHeading,
  CurrencyDisplay,
  EmptyState,
  Reveal,
} from "@/components/shared/common";
import { useDemo } from "@/lib/dummy/store";
import { TrendChart, CompositionChart } from "@/features/dashboard/charts";
import { tanggal } from "@/lib/utils";
export function ReportsPage() {
  const { data, familyId } = useDemo();
  const [period, setPeriod] = useState("monthly");
  const [start, setStart] = useState(monthStart());
  const [end, setEnd] = useState(today());
  const [group, setGroup] = useState<"category" | "member" | "wallet">(
    "category",
  );
  const [remote, setRemote] = useState<{
    key: string;
    report: FinancialReport;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const invalid = !reportFilter.safeParse({ start, end }).success;
  const key = familyId + ":" + start + ":" + end;
  const fallback = useMemo(
    () =>
      isDemo
        ? demoReport(data, familyId, start, end)
        : aggregateReport(data.familyName, start, end, []),
    [data, familyId, start, end],
  );
  useEffect(() => {
    if (isDemo || invalid) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch("/api/laporan?" + new URLSearchParams({ start, end }), {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            "Laporan belum dapat dimuat. Periksa koneksi dan sesi Anda.",
          );
        const report: FinancialReport = await response.json();
        if (!controller.signal.aborted) setRemote({ key, report });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [start, end, key, invalid, data, retry]);
  const pending = !isDemo && (loading || remote?.key !== key);
  const report = isDemo
    ? fallback
    : remote?.key === key
      ? remote.report
      : fallback;
  const { income, expense } = report;
  const grouped = report[group];
  const composition = grouped
    .filter((r) => r.expense > 0)
    .map((r) => ({ name: r.name, value: r.expense, color: r.color }));
  const trend = report.trend.map((r) => ({ ...r, name: tanggal(r.date) }));
  async function download(kind: "pdf" | "excel") {
    if (invalid || pending || error || exporting) return;
    setExporting(kind);
    try {
      const exporter = await import("@/lib/report-export");
      await (kind === "pdf"
        ? exporter.exportPdf(report)
        : exporter.exportExcel(report));
      toast.success("Laporan berhasil diunduh");
    } catch {
      toast.error("Laporan belum dapat diunduh. Coba kembali.");
    } finally {
      setExporting(null);
    }
  }
  function changePeriod(v: string) {
    setPeriod(v);
    if (v === "daily") {
      setStart(today());
      setEnd(today());
    }
    if (v === "weekly") {
      setStart(daysAgo(6));
      setEnd(today());
    }
    if (v === "monthly") {
      setStart(monthStart());
      setEnd(today());
    }
  }
  return (
    <Reveal>
      <PageHeading
        title="Pahami cerita keuangan kita"
        description="Lihat kebiasaan, temukan ruang untuk menabung, dan rencanakan langkah berikutnya."
        action={
          <div className="flex gap-2">
            <Button
              disabled={invalid || pending || !!error || !!exporting}
              loading={exporting === "pdf"}
              onClick={() => download("pdf")}
              variant="outline"
            >
              <Download size={14} />
              PDF
            </Button>
            <Button
              disabled={invalid || pending || !!error || !!exporting}
              loading={exporting === "excel"}
              onClick={() => download("excel")}
              variant="outline"
            >
              <FileSpreadsheet size={14} />
              Excel
            </Button>
          </div>
        }
      />
      <div className="panel mb-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-xs font-medium">Periode laporan</p>
            <div className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">
              {[
                ["daily", "Harian"],
                ["weekly", "Mingguan"],
                ["monthly", "Bulanan"],
                ["custom", "Kustom"],
              ].map(([v, l]) => (
                <Button
                  key={v}
                  variant={period === v ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => changePeriod(v)}
                >
                  {l}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="field text-xs">
              Dari tanggal
              <Input
                type="date"
                required
                value={start}
                max={end}
                onChange={(e) => {
                  setStart(e.target.value);
                  setPeriod("custom");
                }}
              />
            </label>
            <label className="field text-xs">
              Sampai tanggal
              <Input
                type="date"
                required
                value={end}
                min={start}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setPeriod("custom");
                }}
              />
            </label>
          </div>
        </div>
        <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
          Laporan mencakup transaksi keluarga pada periode pilihan. Transfer
          antar dompet, termasuk menabung ke dompet target, tidak dihitung
          sebagai pemasukan atau pengeluaran. File Excel tetap mencantumkan
          transfer pada lembar Transaksi.
        </p>
      </div>
      {invalid ? (
        <EmptyState
          title="Periksa rentang tanggal"
          description="Isi tanggal awal dan akhir dengan urutan yang benar untuk melihat laporan."
        />
      ) : error ? (
        <div className="panel" role="alert">
          <p>{error}</p>
          <Button className="mt-4" onClick={() => setRetry((v) => v + 1)}>
            Coba lagi
          </Button>
        </div>
      ) : pending ? (
        <div className="panel animate-pulse" role="status">
          Memuat laporan keluarga…
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Total pemasukan",
                amount: income,
                icon: ArrowDownLeft,
                color: "text-success",
              },
              {
                label: "Total uang keluar",
                amount: expense,
                icon: ArrowUpRight,
                color: "text-destructive",
              },
              {
                label: "Selisih arus kas",
                amount: income - expense,
                icon: Wallet,
                color: "text-primary",
              },
            ].map((s) => (
              <div className="panel" key={s.label}>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    {s.label}
                  </span>
                  <s.icon size={18} className={s.color} />
                </div>
                <CurrencyDisplay
                  amount={s.amount}
                  className="mt-3 block text-2xl font-semibold"
                />
                <p className="mt-3 text-[10px] text-muted-foreground">
                  {tanggal(start)} – {tanggal(end, true)}
                </p>
              </div>
            ))}
          </div>
          <div className="mb-6 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
            <section className="panel min-w-0">
              <h2 className="mb-5 text-sm font-bold">Perjalanan uang kita</h2>
              {trend.length ? (
                <TrendChart data={trend} />
              ) : (
                <EmptyState
                  title="Belum ada arus kas"
                  description="Pilih periode lain atau catat transaksi untuk mulai melihat tren."
                />
              )}
            </section>
            <section className="panel">
              <h2 className="mb-2 text-sm font-bold">Komposisi uang keluar</h2>
              {composition.length ? (
                <CompositionChart data={composition} />
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Belum ada pengeluaran di periode ini.
                </p>
              )}
            </section>
          </div>
          <section className="panel">
            <div className="mb-6 flex flex-wrap justify-between gap-4">
              <h2 className="text-base font-bold">Rincian laporan</h2>
              <div className="flex gap-1">
                {[
                  ["category", "Kategori"],
                  ["member", "Anggota"],
                  ["wallet", "Dompet"],
                ].map(([v, l]) => (
                  <Button
                    key={v}
                    size="sm"
                    variant={group === v ? "secondary" : "ghost"}
                    onClick={() =>
                      setGroup(v as "category" | "member" | "wallet")
                    }
                  >
                    Per {l}
                  </Button>
                ))}
              </div>
            </div>
            {grouped.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {group === "category"
                        ? "Kategori"
                        : group === "member"
                          ? "Anggota"
                          : "Dompet"}
                    </TableHead>
                    <TableHead className="text-center">Catatan</TableHead>
                    <TableHead className="text-right">Pemasukan</TableHead>
                    <TableHead className="text-right">Uang keluar</TableHead>
                    <TableHead className="text-right">Selisih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 text-xs">
                          <span
                            className="size-2 rounded-full"
                            style={{ background: r.color }}
                          />
                          {r.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {r.count}
                      </TableCell>
                      <TableCell className="text-right">
                        <CurrencyDisplay
                          amount={r.income}
                          className="text-xs text-success"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <CurrencyDisplay
                          amount={r.expense}
                          className="text-xs text-destructive"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <CurrencyDisplay
                          amount={r.income - r.expense}
                          className="text-xs font-semibold"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                title="Belum ada catatan dalam periode ini"
                description="Pilih rentang tanggal lain atau mulai catat transaksi keluarga Anda."
              />
            )}
          </section>
        </>
      )}
    </Reveal>
  );
}
