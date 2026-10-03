import "server-only";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { withIdentity, type Identity, type TenantTx } from "./index";
import * as s from "./schema";
import type { DemoData } from "@/lib/dummy/store";
import type { Transaction } from "@/lib/dummy/data";
import { supabaseServer } from "@/lib/supabase/server";
export async function snapshot(
  tx: TenantTx,
  identity: Identity,
): Promise<DemoData> {
  const { familyId: f } = identity;
  const [family] = await tx
    .select()
    .from(s.families)
    .where(eq(s.families.id, f));
  if (!family) throw new Error("Keluarga tidak tersedia.");
  const users = await tx.select().from(s.users).where(eq(s.users.familyId, f));
  const wallets = await tx
    .select()
    .from(s.wallets)
    .where(eq(s.wallets.familyId, f));
  const categories = await tx
    .select()
    .from(s.categories)
    .where(eq(s.categories.familyId, f));
  const transactions = await tx
    .select()
    .from(s.transactions)
    .where(eq(s.transactions.familyId, f))
    .orderBy(
      desc(s.transactions.transactionDate),
      desc(s.transactions.createdAt),
      desc(s.transactions.id),
    );
  const goals = await tx
    .select()
    .from(s.savingGoals)
    .where(eq(s.savingGoals.familyId, f));
  const logs = await tx
    .select()
    .from(s.auditLogs)
    .where(eq(s.auditLogs.familyId, f))
    .orderBy(sql`${s.auditLogs.createdAt} desc`)
    .limit(500);
  const balances = await tx.execute(
    sql`select id,public.wallet_balance(id,${f}::uuid) as balance from public.wallets where family_id=${f}::uuid`,
  );
  const [aggregate] = await tx.execute(
    sql`select public.family_balance(${f}::uuid) as balance`,
  );
  const labels: Record<string, string> = {
    transactions: "Transaksi",
    wallets: "Dompet",
    categories: "Kategori",
    saving_goals: "Target",
    saving_contributions: "Kontribusi",
    users: "Anggota",
    families: "Keluarga",
  };
  return {
    familyName: family.name,
    inviteCode: family.inviteCode,
    inviteExpiresAt: family.inviteExpiresAt?.toISOString(),
    familyBalance: Number(aggregate.balance),
    walletBalances: Object.fromEntries(
      balances.map((b) => [String(b.id), Number(b.balance)]),
    ),
    users: users.map((u) => ({ ...u, avatarUrl: u.avatarUrl || undefined })),
    wallets: wallets.map((w) => ({
      ...w,
      type: "shared" as const,
      color: w.color || "#7c3aed",
    })),
    categories: categories.map((c) => ({
      ...c,
      monthlyBudget: c.monthlyBudget ? Number(c.monthlyBudget) : undefined,
      icon: c.icon || "tag",
      color: c.color || "#7c3aed",
    })),
    transactions: transactions.map((t) => ({
      id: t.id,
      familyId: f,
      userId: t.userId,
      walletId: t.walletId,
      toWalletId: t.toWalletId || undefined,
      categoryId: t.categoryId || "",
      type: t.type,
      amount: Number(t.amount),
      description: t.description || "",
      date: t.transactionDate,
      createdAt: t.createdAt.toISOString(),
      receiptPath: t.type === "expense" ? t.receiptUrl || undefined : undefined,
      receiptOcrData: ((t.type === "expense" ? t.receiptOcrData : null) ||
        undefined) as Transaction["receiptOcrData"],
      receipt: undefined,
    })),
    goals: goals.map((g) => ({
      id: g.id,
      familyId: f,
      name: g.name,
      target: Number(g.targetAmount),
      walletId: g.walletId,
      deadline: g.deadline || "",
      icon: g.icon || "target",
      status: g.status,
    })),
    contributions: [],
    logs: logs.map((l) => {
      const r = (l.afterData || l.beforeData || {}) as Record<string, unknown>;
      return {
        id: l.id,
        familyId: f,
        userId: l.userId || "",
        action: l.action,
        entity: labels[l.entityType] || l.entityType,
        entityId: l.entityId || "",
        date: l.createdAt.toISOString(),
        detail: `${l.action === "create" ? "Menambahkan" : l.action === "update" ? "Memperbarui" : "Menghapus"} ${String(r.description || r.name || labels[l.entityType] || "catatan")}`,
      };
    }),
  };
}
export async function getWorkspace() {
  const workspace = await withIdentity(async (tx, id) => ({
    data: await snapshot(tx, id),
    identity: id,
  }));
  // Lepas koneksi database sebelum menunggu layanan Storage.
  const paths = [
    ...new Set(
      workspace.data.transactions.flatMap((t) =>
        t.receiptPath ? [t.receiptPath] : [],
      ),
    ),
  ];
  if (paths.length) {
    const client = await supabaseServer();
    const { data: urls } = await client.storage
      .from("receipts")
      .createSignedUrls(paths, 3600);
    const signed = new Map(urls?.map((u) => [u.path, u.signedUrl]));
    workspace.data.transactions = workspace.data.transactions.map((t) => ({
      ...t,
      receipt: t.receiptPath
        ? signed.get(t.receiptPath) || undefined
        : undefined,
    }));
  }
  return workspace;
}
const filterSchema = z.object({
  start: z.iso.date().optional(),
  end: z.iso.date().optional(),
  walletId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  userId: z.uuid().optional(),
});
export async function getTransactionsByFamily(input: unknown = {}) {
  const filter = filterSchema.parse(input);
  return withIdentity((tx, { familyId: f }) =>
    tx
      .select()
      .from(s.transactions)
      .where(
        and(
          eq(s.transactions.familyId, f),
          filter.start
            ? gte(s.transactions.transactionDate, filter.start)
            : undefined,
          filter.end
            ? lte(s.transactions.transactionDate, filter.end)
            : undefined,
          filter.walletId
            ? eq(s.transactions.walletId, filter.walletId)
            : undefined,
          filter.categoryId
            ? eq(s.transactions.categoryId, filter.categoryId)
            : undefined,
          filter.userId ? eq(s.transactions.userId, filter.userId) : undefined,
        ),
      )
      .orderBy(
        desc(s.transactions.transactionDate),
        desc(s.transactions.createdAt),
        desc(s.transactions.id),
      ),
  );
}
function sameFamily(requested: string, actual: string) {
  if (!z.uuid().safeParse(requested).success || requested !== actual)
    throw new Error("Keluarga tidak dapat diakses.");
}
export async function getWalletBalances(familyId: string) {
  return withIdentity(async (tx, id) => {
    sameFamily(familyId, id.familyId);
    return tx.execute(
      sql`select id,public.wallet_balance(id,${familyId}::uuid) as balance from public.wallets where family_id=${familyId}::uuid`,
    );
  });
}
export async function getSavingGoals(familyId: string) {
  return withIdentity((tx, id) => {
    sameFamily(familyId, id.familyId);
    return tx
      .select()
      .from(s.savingGoals)
      .where(eq(s.savingGoals.familyId, familyId));
  });
}
export async function getAuditLogs(familyId: string) {
  return withIdentity((tx, id) => {
    sameFamily(familyId, id.familyId);
    return tx
      .select()
      .from(s.auditLogs)
      .where(eq(s.auditLogs.familyId, familyId))
      .orderBy(sql`${s.auditLogs.createdAt} desc`)
      .limit(500);
  });
}
