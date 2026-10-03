"use client";
import { createContext, useContext, useState, useRef } from "react";
import { toast } from "sonner";
import {
  insufficientWallet,
  insufficientFundsMessage,
} from "@/lib/workspace/funds";
import * as seed from "./data";
import type {
  Wallet,
  Transaction,
  Category,
  Goal,
  Contribution,
  Audit,
  User,
} from "./data";

export type DemoData = {
  familyBalance?: number;
  walletBalances?: Record<string, number>;
  inviteExpiresAt?: string;
  familyName: string;
  inviteCode: string;
  users: User[];
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  contributions: Contribution[];
  logs: Audit[];
};
const initial: DemoData = {
  familyName: "Keluarga Budi & Sari",
  inviteCode: "DUIT-XY7A",
  users: seed.users,
  wallets: seed.wallets,
  categories: seed.categories,
  transactions: seed.transactions,
  goals: seed.goals,
  contributions: seed.contributions,
  logs: seed.auditLogs,
};
export type Store = {
  data: DemoData;
  user: User;
  familyId: string;
  setUserId: (id: string) => void;
  update: (fn: (data: DemoData) => DemoData) => boolean | Promise<boolean>;
  reset: () => void;
  log: (
    data: DemoData,
    action: Audit["action"],
    entity: string,
    entityId: string,
    detail: string,
    privateOwnerId?: string,
  ) => Audit[];
};
export const Context = createContext<Store | null>(null);
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DemoData>(normalizeGoals(initial));
  const current = useRef(data);
  const [userId, setUserId] = useState("budi");
  const user =
    data.users.find((u) => u.id === userId && u.familyId === seed.FAMILY_ID) ??
    data.users[0];
  const log: Store["log"] = (
    current,
    action,
    entity,
    entityId,
    detail,
    privateOwnerId,
  ) => [
    {
      id: crypto.randomUUID(),
      familyId: seed.FAMILY_ID,
      userId: user.id,
      action,
      entity,
      entityId,
      detail,
      privateOwnerId,
      date: new Date().toISOString(),
    },
    ...current.logs,
  ];
  return (
    <Context.Provider
      value={{
        data,
        user,
        familyId: seed.FAMILY_ID,
        setUserId,
        update: (fn) => {
          const before = current.current;
          const after = fn(before);
          if (!validateTransactionFunds(before, after, seed.FAMILY_ID)) {
            toast.error(insufficientFundsMessage);
            return false;
          }
          current.current = normalizeGoals(after);
          setData(current.current);
          return true;
        },
        reset: () => {
          current.current = normalizeGoals(initial);
          setData(current.current);
          setUserId("budi");
        },
        log,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDemo() {
  const context = useContext(Context);
  if (!context) throw new Error("DemoProvider diperlukan");
  return context;
}
export function visibleWallets(
  data: DemoData,
  familyId: string,
  userId: string,
) {
  if (!data.users.some((u) => u.id === userId && u.familyId === familyId))
    return [];
  return data.wallets.filter((w) => w.familyId === familyId);
}
export function visibleTransactions(
  data: DemoData,
  familyId: string,
  userId: string,
) {
  const allowed = new Set(
    visibleWallets(data, familyId, userId).map((w) => w.id),
  );
  return data.transactions
    .filter(
      (t) =>
        t.familyId === familyId &&
        allowed.has(t.walletId) &&
        (!t.toWalletId || allowed.has(t.toWalletId)),
    )
    .sort(newestTransactionFirst);
}
export function newestTransactionFirst(a: Transaction, b: Transaction) {
  return (
    b.date.localeCompare(a.date) ||
    (b.createdAt ?? "").localeCompare(a.createdAt ?? "") ||
    b.id.localeCompare(a.id, "en", { numeric: true })
  );
}
export function walletBalance(
  data: DemoData,
  familyId: string,
  walletId: string,
) {
  if (!data.wallets.some((w) => w.id === walletId && w.familyId === familyId))
    return 0;
  if (data.walletBalances && walletId in data.walletBalances)
    return data.walletBalances[walletId];
  return data.transactions
    .filter((t) => t.familyId === familyId)
    .reduce(
      (sum, t) =>
        sum +
        (t.walletId === walletId
          ? t.type === "income"
            ? t.amount
            : -t.amount
          : 0) +
        (t.toWalletId === walletId && t.type === "transfer" ? t.amount : 0),
      0,
    );
}
export function goalAmount(data: DemoData, familyId: string, goalId: string) {
  const goal = data.goals.find(
    (g) => g.id === goalId && g.familyId === familyId,
  );
  return goal ? walletBalance(data, familyId, goal.walletId) : 0;
}
export function goalStatus(
  data: DemoData,
  familyId: string,
  goal: Goal,
): Goal["status"] {
  return goal.status === "archived"
    ? "archived"
    : goalAmount(data, familyId, goal.id) >= goal.target
      ? "achieved"
      : "active";
}
export function primaryWallet(data: DemoData, familyId: string) {
  return data.wallets.find((w) => w.familyId === familyId && w.isPrimary);
}

export function normalizeGoals(data: DemoData): DemoData {
  return {
    ...data,
    goals: data.goals.map((g) => ({
      ...g,
      status: goalStatus(data, g.familyId, g),
    })),
  };
}

export function validateTransactionFunds(
  before: DemoData,
  after: DemoData,
  familyId: string,
) {
  const balances = Object.fromEntries(
    before.wallets
      .filter((w) => w.familyId === familyId)
      .map((w) => [w.id, walletBalance(before, familyId, w.id)]),
  );
  const previous = new Map(
    before.transactions
      .filter((t) => t.familyId === familyId)
      .map((t) => [t.id, t]),
  );
  const proposed = new Map(
    after.transactions
      .filter((t) => t.familyId === familyId)
      .map((t) => [t.id, t]),
  );
  for (const id of new Set([...previous.keys(), ...proposed.keys()])) {
    const old = previous.get(id),
      next = proposed.get(id);
    if (old !== next && insufficientWallet(balances, old, next)) return false;
  }
  return true;
}
