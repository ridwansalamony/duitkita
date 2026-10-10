import postgres from "postgres";
import { runtimeDatabaseUrl } from "./runtime-url";

// Next.js dapat memuat ulang modul saat development. Simpan pool pada proses,
// bukan scope modul, agar hot reload tidak meninggalkan pool koneksi baru.
const processDatabase = globalThis as typeof globalThis & {
  duitkitaSql?: ReturnType<typeof postgres>;
};

export function databaseConnection() {
  if (!process.env.DATABASE_URL)
    throw new Error("Lengkapi DATABASE_URL di .env.local.");
  processDatabase.duitkitaSql ??= postgres(
    runtimeDatabaseUrl(process.env.DATABASE_URL),
    {
      prepare: false,
      max: 2,
      idle_timeout: 20,
      max_lifetime: 600,
      connect_timeout: 10,
      connection: { application_name: "duitkita" },
    },
  );
  return processDatabase.duitkitaSql;
}
