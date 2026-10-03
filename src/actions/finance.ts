"use server";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";

import { withIdentity } from "@/db";
import * as s from "@/db/schema";
import { getWorkspace } from "@/db/queries";
import { supabaseServer } from "@/lib/supabase/server";
const id = z.uuid(),
  amount = z.number().positive().max(9999999999999.99).multipleOf(0.01);
const name = z.string().trim().min(1).max(120),
  color = z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon = z.string().min(1).max(50);
const txSchema = z
  .object({
    id,
    walletId: id,
    toWalletId: id.optional(),
    categoryId: z.union([id, z.literal("")]),
    type: z.enum(["income", "expense", "transfer"]),
    amount,
    description: z.string().trim().max(2000),
    date: z.iso.date(),
    receiptPath: z.string().max(300).optional(),
    receiptOcrData: z
      .object({
        merchant: z.string().max(300).nullable(),
        total: amount.nullable(),
        date: z.iso.date().nullable(),
      })
      .optional(),
  })
  .superRefine((v, c) => {
    if (
      v.type === "transfer"
        ? !v.toWalletId || v.walletId === v.toWalletId
        : !v.categoryId || !!v.toWalletId
    )
      c.addIssue({
        code: "custom",
        message: "Dompet dan kategori belum sesuai.",
      });
  });
const walletSchema = z.object({
  id,
  name,
  type: z.literal("shared"),
  color,
});
const categorySchema = z.object({
  id,
  name: name.max(100),
  type: z.enum(["income", "expense"]),
  color,
  icon,
  monthlyBudget: amount.optional(),
});
const goalSchema = z.object({
  id,
  walletId: id,
  name: z.string().trim().min(1).max(150),
  target: amount,
  deadline: z.union([z.iso.date(), z.literal("")]),
  icon,
  status: z.enum(["active", "achieved"]),
});
const operationSchema = z.object({
  entity: z.enum([
    "transactions",
    "wallets",
    "categories",
    "goals",
    "profile",
    "family",
    "invite",
    "member",
  ]),
  action: z.enum(["create", "update", "delete"]),
  value: z.unknown(),
});
function mutationError(error: unknown) {
  if (error instanceof z.ZodError)
    return "Isian belum sesuai. Periksa nominal, tanggal, dan kolom wajib.";
  const source = error as {
    code?: string;
    message?: string;
    cause?: { code?: string; message?: string };
  };
  const code = source.cause?.code || source.code;
  if (code === "23503")
    return "Catatan masih digunakan atau referensinya tidak tersedia.";
  if (code === "42501") return "Anda tidak memiliki akses untuk perubahan ini.";
  if (code === "23505")
    return "Catatan sudah ada atau dompet telah terhubung ke target lain.";
  const message = source.cause?.message || source.message || "";
  const safe = [
    "Saldo dompet belum mencukupi",
    "Kategori Lainnya tetap diperlukan",
    "Jenis kategori yang terpakai tidak dapat diubah",
    "Kepemilikan dompet tidak dapat diubah",
    "Target tidak aktif",
    "Dompet utama tidak dapat dihapus",
    "Dompet utama tidak dapat diganti",
    "Dompet target berbeda keluarga",
    "Dompet sudah digunakan oleh target lain",
    "Fitur arsip target tidak tersedia",
    "Sesi berakhir. Silakan masuk kembali.",
  ];
  return safe.includes(message)
    ? message
    : "Perubahan belum tersimpan. Periksa koneksi dan coba kembali.";
}
export async function mutate(input: unknown) {
  try {
    const { entity, action, value } = operationSchema.parse(input);

    const family = await withIdentity(
      async (tx, { familyId: f, userId: u, role }) => {
        const removed = id.parse(
          action === "delete" ? value : "00000000-0000-4000-8000-000000000000",
        );
        let touched: unknown[] = [];
        if (entity === "transactions") {
          if (action === "delete")
            touched = await tx
              .delete(s.transactions)
              .where(
                and(
                  eq(s.transactions.id, removed),
                  eq(s.transactions.familyId, f),
                ),
              )
              .returning({ id: s.transactions.id });
          else {
            const v = txSchema.parse(value);
            if (v.type !== "expense") {
              v.receiptPath = undefined;
              v.receiptOcrData = undefined;
            }
            if (v.receiptPath) {
              if (
                !new RegExp(`^${f}/[0-9a-f-]{36}/[0-9a-f-]+\\.(jpg|png)$`).test(
                  v.receiptPath,
                )
              )
                throw new Error("Lampiran tidak valid");
              const { data, error } = await (
                await supabaseServer()
              ).storage
                .from("receipts")
                .download(v.receiptPath);
              if (error || !data) throw new Error("Lampiran tidak tersedia");
            }
            const record = {
              walletId: v.walletId,
              toWalletId: v.toWalletId || null,
              categoryId: v.categoryId || null,
              type: v.type,
              amount: v.amount.toFixed(2),
              description:
                v.type === "transfer" ? "Transfer antar dompet" : v.description,
              transactionDate: v.date,
              receiptUrl: v.receiptPath || null,
              receiptOcrData: v.receiptPath ? v.receiptOcrData || null : null,
            };
            touched =
              action === "create"
                ? await tx
                    .insert(s.transactions)
                    .values({ ...record, id: v.id, familyId: f, userId: u })
                    .returning({ id: s.transactions.id })
                : await tx
                    .update(s.transactions)
                    .set(record)
                    .where(
                      and(
                        eq(s.transactions.id, v.id),
                        eq(s.transactions.familyId, f),
                      ),
                    )
                    .returning({ id: s.transactions.id });
          }
        } else if (entity === "wallets") {
          if (action === "delete")
            touched = await tx
              .delete(s.wallets)
              .where(and(eq(s.wallets.id, removed), eq(s.wallets.familyId, f)))
              .returning({ id: s.wallets.id });
          else {
            const v = walletSchema.parse(value);
            const record = {
              name: v.name,
              color: v.color,
              type: v.type,
              ownerUserId: null,
            };
            touched =
              action === "create"
                ? await tx
                    .insert(s.wallets)
                    .values({ ...record, id: v.id, familyId: f })
                    .returning({ id: s.wallets.id })
                : await tx
                    .update(s.wallets)
                    .set(record)
                    .where(
                      and(eq(s.wallets.id, v.id), eq(s.wallets.familyId, f)),
                    )
                    .returning({ id: s.wallets.id });
          }
        } else if (entity === "categories") {
          if (action === "delete")
            touched = await tx
              .delete(s.categories)
              .where(
                and(eq(s.categories.id, removed), eq(s.categories.familyId, f)),
              )
              .returning({ id: s.categories.id });
          else {
            const v = categorySchema.parse(value);
            const record = {
              name: v.name,
              type: v.type,
              color: v.color,
              icon: v.icon,
              monthlyBudget:
                v.type === "expense" && v.monthlyBudget
                  ? v.monthlyBudget.toFixed(2)
                  : null,
            };
            touched =
              action === "create"
                ? await tx
                    .insert(s.categories)
                    .values({ ...record, id: v.id, familyId: f })
                    .returning({ id: s.categories.id })
                : await tx
                    .update(s.categories)
                    .set(record)
                    .where(
                      and(
                        eq(s.categories.id, v.id),
                        eq(s.categories.familyId, f),
                      ),
                    )
                    .returning({ id: s.categories.id });
          }
        } else if (entity === "goals") {
          if (action === "delete")
            throw new Error("Fitur arsip target tidak tersedia");
          else {
            const v = goalSchema.parse(value);
            const record = {
              name: v.name,
              targetAmount: v.target.toFixed(2),
              walletId: v.walletId,
              deadline: v.deadline || null,
              icon: v.icon,
              status: v.status,
            };
            touched =
              action === "create"
                ? await tx
                    .insert(s.savingGoals)
                    .values({
                      ...record,
                      id: v.id,
                      familyId: f,
                      createdByUserId: u,
                    })
                    .returning({ id: s.savingGoals.id })
                : await tx
                    .update(s.savingGoals)
                    .set(record)
                    .where(
                      and(
                        eq(s.savingGoals.id, v.id),
                        eq(s.savingGoals.familyId, f),
                      ),
                    )
                    .returning({ id: s.savingGoals.id });
          }
        } else if (entity === "profile" && action === "update") {
          const v = z
            .object({
              name,
              avatarUrl: z
                .string()
                .max(400000)
                .regex(/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/)
                .optional(),
            })
            .parse(value);
          touched = await tx
            .update(s.users)
            .set({ name: v.name, avatarUrl: v.avatarUrl || null })
            .where(and(eq(s.users.id, u), eq(s.users.familyId, f)))
            .returning({ id: s.users.id });
        } else if (
          role === "owner" &&
          entity === "member" &&
          action === "delete"
        ) {
          await tx.execute(sql`select public.remove_member(${removed}::uuid)`);
          touched = [removed];
        } else if (
          role === "owner" &&
          action === "update" &&
          (entity === "family" || entity === "invite")
        ) {
          touched = await tx
            .update(s.families)
            .set(
              entity === "family"
                ? { name: name.parse(value) }
                : {
                    inviteCode: crypto
                      .randomUUID()
                      .replaceAll("-", "")
                      .slice(0, 12)
                      .toUpperCase(),
                    inviteExpiresAt: new Date(Date.now() + 7 * 86400000),
                  },
            )
            .where(eq(s.families.id, f))
            .returning({ id: s.families.id });
        }
        if (!touched.length)
          throw new Error("Catatan tidak tersedia atau akses ditolak");
        if (entity === "invite" || entity === "family" || entity === "member") {
          const [family] = await tx
            .select()
            .from(s.families)
            .where(eq(s.families.id, f));
          return {
            familyName: family.name,
            inviteCode: family.inviteCode,
            inviteExpiresAt: family.inviteExpiresAt?.toISOString(),
          };
        }
        return null;
      },
    );
    return { success: true as const, family };
  } catch (error) {
    return { success: false as const, error: mutationError(error) };
  }
}
export async function refreshWorkspace() {
  try {
    return { success: true as const, ...(await getWorkspace()) };
  } catch {
    return {
      success: false as const,
      error:
        "Ruang keluarga tidak dapat dimuat. Masuk kembali jika keanggotaan berubah.",
    };
  }
}
export async function realtimeToken() {
  const c = await supabaseServer();
  const {
    data: { user },
  } = await c.auth.getUser();
  if (!user) return null;
  const {
    data: { session },
  } = await c.auth.getSession();
  return session?.access_token || null;
}
export async function createTransaction(value: unknown) {
  return mutate({ entity: "transactions", action: "create", value });
}
export async function updateTransaction(value: unknown) {
  return mutate({ entity: "transactions", action: "update", value });
}
export async function deleteTransaction(value: unknown) {
  return mutate({ entity: "transactions", action: "delete", value });
}
export async function createWallet(value: unknown) {
  return mutate({ entity: "wallets", action: "create", value });
}
export async function updateWallet(value: unknown) {
  return mutate({ entity: "wallets", action: "update", value });
}
export async function deleteWallet(value: unknown) {
  return mutate({ entity: "wallets", action: "delete", value });
}
export async function createCategory(value: unknown) {
  return mutate({ entity: "categories", action: "create", value });
}
export async function updateCategory(value: unknown) {
  return mutate({ entity: "categories", action: "update", value });
}
export async function deleteCategory(value: unknown) {
  return mutate({ entity: "categories", action: "delete", value });
}
export async function createGoal(value: unknown) {
  return mutate({ entity: "goals", action: "create", value });
}
export async function updateGoal(value: unknown) {
  return mutate({ entity: "goals", action: "update", value });
}
export async function deleteGoal(value: unknown) {
  return mutate({ entity: "goals", action: "delete", value });
}
