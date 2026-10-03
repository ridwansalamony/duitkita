import type { FinancialReport, ReportGroup } from "./reports";
const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const rupiah = (value: number) =>
  currency.format(Math.round(value * 100) / 100);

export async function exportExcel(report: FinancialReport) {
  const XLSX = await import("xlsx");
  const book = XLSX.utils.book_new();
  const add = (
    name: string,
    headers: string[],
    rows: (string | number)[][],
  ) => {
    const sheet = XLSX.utils.aoa_to_sheet([
      [report.familyName],
      [`Periode ${report.start} sampai ${report.end}`],
      [],
      headers,
      ...rows,
    ]);
    sheet["!cols"] = headers.map((header) => ({
      wch: header === "Catatan" ? 48 : 24,
    }));
    sheet["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: 3, c: 0 },
        e: { r: 3 + rows.length, c: headers.length - 1 },
      }),
    };
    // Strings remain string cells: user input beginning '=' is never a formula.
    for (const [address, cell] of Object.entries(sheet)) {
      if (!address.startsWith("!") && cell.t === "n") cell.z = "#,##0.00";
    }
    XLSX.utils.book_append_sheet(book, sheet, name);
  };
  add(
    "Transaksi",
    [
      "Tanggal",
      "Jenis",
      "Catatan",
      "Kategori",
      "Dicatat oleh",
      "Dompet",
      "Dompet tujuan",
      "Nominal (Rp)",
    ],
    report.transactions.map((t) => [
      t.date,
      { income: "Pemasukan", expense: "Pengeluaran", transfer: "Transfer" }[
        t.type
      ],
      t.description,
      t.category,
      t.member,
      t.wallet,
      t.destination,
      t.amount,
    ]),
  );
  const summary = (rows: ReportGroup[]) =>
    rows.map((r) => [
      r.name,
      r.count,
      r.income,
      r.expense,
      Math.round((r.income - r.expense) * 100) / 100,
    ]);
  const headings = [
    "Nama",
    "Jumlah transaksi",
    "Pemasukan (Rp)",
    "Pengeluaran (Rp)",
    "Selisih (Rp)",
  ];
  add("Summary Kategori", headings, summary(report.category));
  add("Summary Anggota", headings, summary(report.member));
  add(
    "Ringkasan",
    ["Keterangan", "Nominal (Rp)"],
    [
      ["Pemasukan", report.income],
      ["Pengeluaran", report.expense],
      ["Selisih", Math.round((report.income - report.expense) * 100) / 100],
      ["Transfer tidak masuk arus kas", ""],
    ],
  );
  XLSX.writeFile(book, `DuitKita_${report.start}_${report.end}.xlsx`, {
    compression: true,
  });
}

export async function exportPdf(report: FinancialReport) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const font = await fetch("/fonts/NotoSans-Regular.ttf");
  if (!font.ok) throw new Error("Font laporan belum tersedia.");
  const bytes = new Uint8Array(await font.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  const doc = new jsPDF({ orientation: "landscape", compress: true });
  doc.addFileToVFS("NotoSans.ttf", btoa(binary));
  doc.addFont("NotoSans.ttf", "NotoSans", "normal");
  doc.setFont("NotoSans");
  doc.setFontSize(22);
  doc.setTextColor(100, 40, 190);
  doc.text("DuitKita", 14, 20);
  doc.setTextColor(35);
  doc.setFontSize(14);
  doc.text(doc.splitTextToSize(report.familyName, 266), 14, 32);
  doc.setFontSize(10);
  doc.text(`Laporan keuangan | ${report.start} sampai ${report.end}`, 14, 48);
  const bars = [
    ["Pemasukan", report.income, [13, 148, 136]],
    ["Pengeluaran", report.expense, [139, 92, 246]],
  ] as const;
  const max = Math.max(report.income, report.expense, 1);
  bars.forEach(([label, value, color], i) => {
    const y = 63 + i * 16;
    doc.text(`${label}: ${rupiah(value)}`, 14, y);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(
      115,
      y - 5,
      Math.max(0.1, (value / max) * 155),
      7,
      1,
      1,
      "F",
    );
  });
  doc.text(
    `Selisih: ${rupiah(report.income - report.expense)} | Transfer antar dompet tidak dihitung sebagai arus kas.`,
    14,
    96,
  );
  autoTable(doc, {
    startY: 105,
    head: [["Kategori", "Catatan", "Pemasukan", "Pengeluaran", "Selisih"]],
    body: report.category.map((r) => [
      r.name,
      r.count,
      rupiah(r.income),
      rupiah(r.expense),
      rupiah(r.income - r.expense),
    ]),
    styles: { font: "NotoSans", fontSize: 9 },
    headStyles: { fillColor: [100, 40, 190], fontStyle: "normal" },
  });
  doc.addPage();
  doc.setFontSize(16);
  doc.text("Rincian transaksi", 14, 20);
  autoTable(doc, {
    startY: 28,
    head: [
      [
        "Tanggal",
        "Jenis",
        "Catatan",
        "Kategori",
        "Pencatat",
        "Dompet / Tujuan",
        "Nominal",
      ],
    ],
    body: report.transactions.map((t) => [
      t.date,
      { income: "Masuk", expense: "Keluar", transfer: "Transfer" }[t.type],
      t.description,
      t.category,
      t.member,
      t.destination ? `${t.wallet} ke ${t.destination}` : t.wallet,
      rupiah(t.amount),
    ]),
    styles: {
      font: "NotoSans",
      fontSize: 8,
      overflow: "linebreak",
      cellPadding: 2,
    },
    headStyles: { fillColor: [100, 40, 190], fontStyle: "normal" },
    columnStyles: { 2: { cellWidth: 65 }, 6: { halign: "right" } },
    margin: { bottom: 16 },
  });
  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(`DuitKita | ${page} / ${count}`, 283, 202, { align: "right" });
  }
  doc.save(`DuitKita_${report.start}_${report.end}.pdf`);
}
