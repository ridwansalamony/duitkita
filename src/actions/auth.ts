"use server";
import { checkAuthRate } from "@/lib/security/rate-limit";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { supabaseServer } from "@/lib/supabase/server";
import { withIdentity } from "@/db";
type AuthResult = { error?: string; success?: boolean; confirmed?: boolean };
const email = z.string().trim().email().max(255);
const password = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Za-z]/)
  .regex(/[0-9]/);
const appUrl = () =>
  new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").origin;
export async function register(input: unknown): Promise<AuthResult> {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(120),
      email,
      password,
      confirm: z.string(),
      next: z
        .string()
        .regex(/^\/undang\/[A-Za-z0-9-]{1,12}$/)
        .optional(),
    })
    .refine((v) => v.password === v.confirm)
    .safeParse(input);
  if (!parsed.success)
    return { error: "Periksa nama, email, dan konfirmasi kata sandi Anda." };
  const limited = await checkAuthRate("register", parsed.data.email);
  if (limited) return limited;
  const { name, email: address, password: secret } = parsed.data;
  const client = await supabaseServer();
  const { data, error } = await client.auth.signUp({
    email: address,
    password: secret,
    options: {
      data: { name },
      emailRedirectTo: `${appUrl()}/autentikasi/konfirmasi?next=${encodeURIComponent(parsed.data.next || "/pengaturan-awal")}`,
    },
  });
  if (error)
    return {
      error:
        "Pendaftaran belum berhasil. Periksa isian atau coba beberapa saat lagi.",
    };
  return { success: true, confirmed: !!data.session };
}
export async function login(input: unknown): Promise<AuthResult> {
  const parsed = z
    .object({ email, password: z.string().min(1).max(128) })
    .safeParse(input);
  if (!parsed.success)
    return { error: "Isi email dan kata sandi dengan benar." };
  const limited = await checkAuthRate("login", parsed.data.email);
  if (limited) return limited;
  const { error } = await (
    await supabaseServer()
  ).auth.signInWithPassword(parsed.data);
  return error
    ? {
        error:
          "Email atau kata sandi belum sesuai, atau email belum diverifikasi.",
      }
    : { success: true };
}
export async function logout() {
  const { error } = await (await supabaseServer()).auth.signOut();
  return error
    ? { success: false as const, error: "Belum berhasil keluar. Coba kembali." }
    : { success: true as const };
}
export async function resetPassword(input: unknown): Promise<AuthResult> {
  const parsed = email.safeParse(input);
  if (!parsed.success) return { error: "Masukkan email yang valid." };
  const limited = await checkAuthRate("recovery", parsed.data);
  if (limited) return limited;
  await (
    await supabaseServer()
  ).auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${appUrl()}/autentikasi/konfirmasi?next=/atur-kata-sandi`,
  });
  return { success: true };
}
export async function changePassword(input: unknown): Promise<AuthResult> {
  const parsed = z
    .object({ password, confirm: z.string(), old: z.string().optional() })
    .refine((v) => v.password === v.confirm)
    .safeParse(input);
  if (!parsed.success)
    return {
      error:
        "Gunakan minimal 8 karakter, huruf dan angka, serta konfirmasi yang sama.",
    };
  const client = await supabaseServer();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user?.email)
    return { error: "Sesi pemulihan berakhir. Minta tautan baru." };
  const limited = await checkAuthRate("password", user.id);
  if (limited) return limited;
  if (parsed.data.old) {
    const { error } = await client.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.old,
    });
    if (error) return { error: "Kata sandi saat ini belum sesuai." };
  }
  const { error } = await client.auth.updateUser({
    password: parsed.data.password,
  });
  return error
    ? {
        error:
          "Kata sandi belum dapat diperbarui. Minta tautan pemulihan baru.",
      }
    : { success: true };
}
async function familyAction(
  kind: "create" | "join",
  input: unknown,
): Promise<AuthResult> {
  const parsed = z
    .string()
    .trim()
    .min(2)
    .max(kind === "create" ? 120 : 12)
    .safeParse(input);
  if (!parsed.success)
    return { error: "Periksa nama keluarga atau kode undangan." };
  const limited = await checkAuthRate("family");
  if (limited) return limited;
  try {
    await withIdentity(async (tx) => {
      await tx.execute(
        kind === "create"
          ? sql`select public.create_family(${parsed.data})`
          : sql`select public.join_family(${parsed.data})`,
      );
    }, false);
    await (await supabaseServer()).auth.refreshSession();
    return { success: true };
  } catch {
    return {
      error:
        kind === "join"
          ? "Kode tidak valid, kedaluwarsa, keluarga sudah penuh, atau akun sudah bergabung."
          : "Keluarga belum dapat dibuat. Pastikan Anda masuk dan belum memiliki keluarga.",
    };
  }
}
export async function createFamily(input: unknown) {
  return familyAction("create", input);
}
export async function joinFamily(input: unknown) {
  return familyAction("join", input);
}
export async function onboarding(input: unknown) {
  const parsed = z
    .object({ kind: z.enum(["create", "join"]), value: z.string() })
    .safeParse(input);
  return parsed.success
    ? familyAction(parsed.data.kind, parsed.data.value)
    : { error: "Pilih buat atau gabung keluarga." };
}
