import { z } from "zod";
import type { DemoData } from "@/lib/dummy/store";
import type { TxType } from "@/lib/dummy/data";

export const reportFilter = z
  .object({ start: z.iso.date(), end: z.iso.date() })
  .strict()
  .refine((v) => v.start <= v.end, "Rentang tanggal tidak valid");
export type ReportTransaction = {
  id: string;
  date: string;
  type: TxType;
  amount: number;
  description: string;
  categoryId: string;
  category: string;
  userId: string;
  member: string;
  walletId: string;
  wallet: string;
  destination: string;
};
export type ReportGroup = {
  id: string;
  name: string;
  color: string;
  count: number;
  income: number;
  expense: number;
};
export type FinancialReport = ReturnType<typeof aggregateReport>;
const palette = [
  "#8b5cf6",
  "#14b8a6",
  "#f59e0b",
  "#ec4899",
  "#3b82f6",
  "#f43f5e",
];

export function aggregateReport(
  familyName: string,
  start: string,
  end: string,
  transactions: ReportTransaction[],
) {
  const groups = {
    category: new Map<string, ReportGroup>(),
    member: new Map<string, ReportGroup>(),
    wallet: new Map<string, ReportGroup>(),
  };
  const days = new Map<
    string,
    { date: string; income: number; expense: number }
  >();
  let income = 0,
    expense = 0;
  for (const t of transactions) {
    if (t.type === "transfer") continue;
    const cents = Math.round(t.amount * 100);
    const field = t.type === "income" ? "income" : "expense";
    if (field === "income") income += cents;
    else expense += cents;
    const day = days.get(t.date) ?? { date: t.date, income: 0, expense: 0 };
    day[field] += cents;
    days.set(t.date, day);
    for (const kind of ["category", "member", "wallet"] as const) {
      const id =
        kind === "member"
          ? t.userId
          : kind === "category"
            ? t.categoryId
            : t.walletId;
      const row = groups[kind].get(id) ?? {
        id,
        name: t[kind],
        count: 0,
        income: 0,
        expense: 0,
        color: palette[groups[kind].size % palette.length],
      };
      row[field] += cents;
      row.count++;
      groups[kind].set(id, row);
    }
  }
  const values = (kind: keyof typeof groups) =>
    Array.from(groups[kind].values()).map((r) => ({
      ...r,
      income: r.income / 100,
      expense: r.expense / 100,
    }));
  return {
    familyName,
    start,
    end,
    transactions,
    income: income / 100,
    expense: expense / 100,
    category: values("category"),
    member: values("member"),
    wallet: values("wallet"),
    trend: Array.from(days.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, income: d.income / 100, expense: d.expense / 100 })),
  };
}

export function demoReport(
  data: DemoData,
  familyId: string,
  start: string,
  end: string,
) {
  const wallets = new Map(
    data.wallets
      .filter((w) => w.familyId === familyId)
      .map((w) => [w.id, w.name]),
  );
  const members = new Map(
    data.users
      .filter((u) => u.familyId === familyId)
      .map((u) => [u.id, u.name]),
  );
  const categories = new Map(
    data.categories
      .filter((c) => c.familyId === familyId)
      .map((c) => [c.id, c.name]),
  );
  const transactions = data.transactions
    .filter(
      (t) =>
        t.familyId === familyId &&
        t.date >= start &&
        t.date <= end &&
        wallets.has(t.walletId) &&
        (!t.toWalletId || wallets.has(t.toWalletId)),
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    )
    .map((t) => ({
      id: t.id,
      date: t.date,
      type: t.type,
      amount: t.amount,
      description: t.description,
      categoryId: t.categoryId,
      category:
        t.type === "transfer"
          ? "Transfer"
          : (categories.get(t.categoryId) ?? "Lainnya"),
      userId: t.userId,
      member: members.get(t.userId) ?? "Anggota sebelumnya",
      walletId: t.walletId,
      wallet: wallets.get(t.walletId)!,
      destination: wallets.get(t.toWalletId ?? "") ?? "",
    }));
  return aggregateReport(data.familyName, start, end, transactions);
}
