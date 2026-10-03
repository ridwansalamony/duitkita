export type ReceiptSuggestion = {
  merchant: string | null;
  total: number | null;
  date: string | null;
};

function money(value: string): number | null {
  const raw = value.replace(/\s/g, "");
  let normalized: string;
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(raw)) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(raw)) {
    normalized = raw.replace(/,/g, "");
  } else if (/^\d+(?:[.,]\d{1,2})?$/.test(raw)) {
    normalized = raw.replace(",", ".");
  } else return null;
  const number = Number(normalized);
  return number > 0 && number <= 9999999999999.99 ? number : null;
}

function dateValue(year: string, month: string, day: string): string | null {
  const y = Number(year),
    m = Number(month),
    d = Number(day);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    y < 2000 ||
    y > 2099 ||
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  )
    return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** Conservative Indonesian receipt parser. Unknown/ambiguous values stay null. */
export function parseReceipt(text: string): ReceiptSuggestion {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const totals: number[] = [];
  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(
      /^(?:grand\s*total|total(?:\s+(?:bayar|belanja|pembayaran|akhir))?|jumlah\s+(?:bayar|pembayaran))\b\s*[:=]?\s*(.*)$/i,
    );
    if (!match) continue;
    const tail = match[1] || lines[index + 1] || "";
    const value = tail.match(
      /^(?:Rp\.?\s*|IDR\s*)?(\d[\d.,]*)(?:\s*(?:IDR|Rp))?\s*$/i,
    );
    if (value) {
      const amount = money(value[1]);
      if (amount !== null) totals.push(amount);
    }
  }
  const dates = new Set<string>();
  for (const match of text.matchAll(
    /\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b|\b(\d{1,2})[/.\-](\d{1,2})[/.\-](20\d{2})\b/g,
  )) {
    const date = match[1]
      ? dateValue(match[1], match[2], match[3])
      : dateValue(match[6], match[5], match[4]);
    if (date) dates.add(date);
  }
  const merchant =
    lines
      .slice(0, 4)
      .find(
        (line) =>
          line.length >= 3 &&
          line.length <= 100 &&
          /[a-z]{3}/i.test(line) &&
          !/\d|^(?:jl\.?|jalan|telp|telepon|tanggal|tgl|kasir|nota|struk|invoice|receipt|selamat|terima kasih|total|subtotal|tunai|kembali)\b/i.test(
            line,
          ),
      ) ?? null;
  return {
    merchant,
    total: totals.length && new Set(totals).size === 1 ? totals[0] : null,
    date: dates.size === 1 ? [...dates][0] : null,
  };
}
