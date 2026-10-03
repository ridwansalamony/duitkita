import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
config({ path: ".env.local", quiet: true });
let url = process.argv.includes("--pooler")
  ? process.env.DATABASE_URL
  : process.env.DIRECT_URL || process.env.DATABASE_URL;
if (url && process.argv.includes("--pooler")) {
  const sessionUrl = new URL(url);
  sessionUrl.port = "5432";
  url = sessionUrl.toString();
}
if (!url) {
  console.error("DIRECT_URL atau DATABASE_URL belum diisi.");
  process.exit(1);
}
const client = postgres(url, { prepare: false, max: 1, connect_timeout: 12 });
try {
  if (process.argv.includes("--migrate")) {
    await migrate(drizzle(client), { migrationsFolder: "supabase/migrations" });
    console.log("Migrasi Drizzle berhasil diterapkan.");
  }
  const rows =
    await client`select tablename,rowsecurity from pg_tables where schemaname='public' and tablename in ('families','users','wallets','categories','transactions','saving_goals','saving_contributions','audit_logs')`;
  console.log(JSON.stringify({ connection: "berhasil", tables: rows }));
} catch (error) {
  const e = error as { code?: string };
  console.error(
    JSON.stringify({ connection: "gagal", code: e.code || "UNKNOWN" }),
  );
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 2 });
}
