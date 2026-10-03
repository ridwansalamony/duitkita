import "server-only";
import { databaseConnection } from "./connection";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { supabaseServer } from "@/lib/supabase/server";
import { headers } from "next/headers";
function database() {
  return drizzle(databaseConnection(), { schema });
}
type Database = ReturnType<typeof database>;
export type TenantTx = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type Identity = {
  userId: string;
  familyId: string;
  role: "owner" | "member";
};
// SET LOCAL berlaku hanya dalam transaksi: koneksi pool tidak mewarisi identitas pengguna lain.
export async function withIdentity<T>(
  run: (tx: TenantTx, identity: Identity) => Promise<T>,
  requireFamily = true,
): Promise<T> {
  const client = await supabaseServer();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new Error("Sesi berakhir. Silakan masuk kembali.");
  const h = await headers();
  return database().transaction(async (tx) => {
    await tx.execute(sql`set local role authenticated`);
    await tx.execute(
      sql`select set_config('app.agent',${h.get("user-agent") || ""},true),set_config('app.ip',${(h.get("x-forwarded-for") || "").split(",")[0].trim()},true),set_config('request.jwt.claims', ${JSON.stringify({ sub: user.id, role: "authenticated" })}, true)`,
    );
    const result = await tx.execute(
      sql`select family_id, role from public.users where id = ${user.id}::uuid`,
    );
    const profile = result[0];
    const familyId = (profile?.family_id as string) || "";
    if (requireFamily && !familyId)
      throw new Error("Selesaikan pengaturan keluarga terlebih dahulu.");
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${JSON.stringify({ sub: user.id, role: "authenticated", family_id: familyId || null })}, true)`,
    );
    return run(tx, {
      userId: user.id,
      familyId,
      role: profile?.role === "owner" ? "owner" : "member",
    });
  });
}
