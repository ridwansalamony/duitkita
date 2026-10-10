import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "DATABASE_URL",
  "DIRECT_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];
const problems = required
  .filter((key) => !process.env[key]?.trim())
  .map((key) => `${key} belum diisi.`);
if (process.env.DATABASE_URL) {
  try {
    const database = new URL(process.env.DATABASE_URL);
    if (
      database.hostname.endsWith(".pooler.supabase.com") &&
      database.port !== "6543"
    )
      problems.push(
        "DATABASE_URL runtime serverless harus memakai Transaction pooler port 6543; DIRECT_URL dipakai untuk migrasi.",
      );
  } catch {
    problems.push("DATABASE_URL tidak valid.");
  }
}
if (process.env.NEXT_PUBLIC_APP_MODE !== "live")
  problems.push("NEXT_PUBLIC_APP_MODE harus live.");
try {
  const app = new URL(process.env.NEXT_PUBLIC_APP_URL || "");
  if (
    app.protocol !== "https:" ||
    ["localhost", "127.0.0.1", "[::1]"].includes(app.hostname)
  )
    problems.push("NEXT_PUBLIC_APP_URL harus URL HTTPS production.");
} catch {
  problems.push("NEXT_PUBLIC_APP_URL belum valid.");
}
for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "UPSTASH_REDIS_REST_URL"]) {
  if (!process.env[key]) continue;
  try {
    if (new URL(process.env[key]).protocol !== "https:") throw new Error();
  } catch {
    problems.push(`${key} harus URL HTTPS yang valid.`);
  }
}
if (problems.length) {
  console.error(
    "Konfigurasi production belum siap:\n" +
      problems.map((p) => `- ${p}`).join("\n"),
  );
  process.exitCode = 1;
} else
  console.log(
    "Konfigurasi wajib terisi. Periksa koneksi layanan dan pengaturan Supabase Auth sebelum rilis.",
  );
