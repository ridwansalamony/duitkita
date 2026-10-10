import { config } from "dotenv";
import postgres from "postgres";
import assert from "node:assert/strict";
config({ path: ".env.local", quiet: true });
const connection = postgres(
  process.env.DIRECT_URL || process.env.DATABASE_URL!,
  { max: 1, prepare: false, connect_timeout: 10 },
);
try {
  const tables =
    await connection`select tablename,rowsecurity from pg_tables where schemaname='public' and tablename in ('families','users','wallets','categories','transactions','saving_goals','saving_contributions','audit_logs')`;
  assert.equal(tables.length, 8);
  assert.ok(tables.every((t) => t.rowsecurity));
  const publication =
    await connection`select tablename from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='audit_logs'`;
  assert.equal(publication.length, 1);
  const indexes =
    await connection`select indexname from pg_indexes where schemaname='public' and indexname in ('tx_family_order_idx','tx_family_destination_idx','tx_receipt_idx')`;
  assert.equal(indexes.length, 3);
  const [violations] =
    await connection`select count(*) as count from public.transactions t
    join public.wallets w on w.id=t.wallet_id
    left join public.wallets d on d.id=t.to_wallet_id
    left join public.categories c on c.id=t.category_id
    where t.family_id<>w.family_id or (d.id is not null and t.family_id<>d.family_id) or (c.id is not null and t.family_id<>c.family_id)`;
  assert.equal(Number(violations.count), 0);
  const constraints =
    await connection`select conname from pg_constraint where conname in ('profile_payload_size','transaction_payload_size')`;
  assert.equal(constraints.length, 2);
  const gates = await connection`select count(*) as count from pg_trigger where tgname='admit_write' and not tgisinternal`;
  assert.equal(Number(gates[0].count), 6);
  const [privacy] = await connection`select has_schema_privilege('authenticated','duitkita_private','USAGE') as exposed`;
  assert.equal(privacy.exposed, false);
  console.log(
    "Lulus: delapan tabel memakai RLS, audit Realtime aktif, indeks dan batas payload terpasang, tidak ada referensi transaksi lintas keluarga. Pemeriksaan hanya baca.",
  );
} catch (error) {
  console.error(
    JSON.stringify({
      audit: "gagal",
      code: (error as { code?: string }).code || "ASSERTION",
    }),
  );
  process.exitCode = 1;
} finally {
  await connection.end({ timeout: 2 });
}
