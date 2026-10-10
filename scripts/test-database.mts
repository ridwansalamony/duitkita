import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role supabase_auth_admin; create schema auth; create schema storage;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;`);
await db.exec(`create function auth.jwt() returns jsonb language sql stable as $$select nullif(current_setting('request.jwt.claims',true),'')::jsonb$$;
grant usage on schema auth,storage to authenticated,anon;grant execute on all functions in schema auth to authenticated,anon;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
grant select,insert on storage.objects to authenticated;
create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
for (const name of [
  "0000_rare_gambit.sql",
  "0001_isolasi_keluarga.sql",
  "0002_realtime_aktivitas.sql",
])
  await db.exec(readFileSync(`supabase/migrations/${name}`, "utf8"));
const budi = "00000000-0000-4000-8000-000000000001",
  sari = "00000000-0000-4000-8000-000000000002",
  other = "00000000-0000-4000-8000-000000000003",
  extra = "00000000-0000-4000-8000-000000000004";
await db.query(
  "insert into auth.users(id,email,raw_user_meta_data) values($1,'budi@test.local','{\"name\":\"Budi\"}'),($2,'sari@test.local','{\"name\":\"Sari\"}'),($3,'other@test.local','{}'),($4,'extra@test.local','{}')",
  [budi, sari, other, extra],
);
async function asUser<T>(
  user: string,
  family: string | null,
  fn: () => Promise<T>,
) {
  await db.exec("begin;set local role authenticated");
  await db.query("select set_config('request.jwt.claims',$1,true)", [
    JSON.stringify({ sub: user, family_id: family, role: "authenticated" }),
  ]);
  try {
    const result = await fn();
    await db.exec("commit");
    return result;
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}
async function scalar(query: string, params: unknown[] = []) {
  const result = await db.query<Record<string, unknown>>(query, params);
  return Object.values(result.rows[0] || {})[0] as string;
}
const family = await asUser(budi, null, () =>
  scalar("select public.create_family('Keluarga Budi & Sari')"),
);
const foreign = await asUser(other, null, () =>
  scalar("select public.create_family('Keluarga Lain')"),
);
const code = await asUser(budi, family, () =>
  scalar("select invite_code from public.families where id=$1", [family]),
);
await asUser(sari, null, () => scalar("select public.join_family($1)", [code]));
await assert.rejects(
  asUser(extra, null, () => scalar("select public.join_family($1)", [code])),
);
await assert.rejects(
  asUser(budi, family, () => scalar("select public.create_family('Duplikat')")),
);
await asUser(sari, family, async () =>
  assert.equal(
    await scalar("select count(*) from public.users where family_id=$1", [
      family,
    ]),
    2,
  ),
);
await asUser(other, foreign, async () =>
  assert.equal(
    await scalar("select count(*) from public.wallets where family_id=$1", [
      family,
    ]),
    0,
  ),
);
await asUser(other, family, async () =>
  assert.equal(
    await scalar("select count(*) from public.wallets where family_id=$1", [
      family,
    ]),
    0,
  ),
);
const wallet = await asUser(budi, family, () =>
  scalar("select id from public.wallets where family_id=$1", [family]),
);
const personal = await asUser(budi, family, () =>
  scalar(
    "insert into public.wallets(family_id,owner_user_id,name,type) values($1,$2,'Pribadi Budi','personal') returning id",
    [family, budi],
  ),
);
const income = await asUser(budi, family, () =>
  scalar(
    "select id from public.categories where family_id=$1 and type='income' limit 1",
    [family],
  ),
);
await asUser(budi, family, () =>
  scalar(
    "insert into public.transactions(family_id,user_id,wallet_id,category_id,type,amount,transaction_date) values($1,$2,$3,$4,'income',100000,'2026-10-01') returning id",
    [family, budi, personal, income],
  ),
);
await asUser(sari, family, async () => {
  assert.equal(
    await scalar(
      "select count(*) from public.transactions where family_id=$1",
      [family],
    ),
    0,
  );
  assert.equal(
    await scalar("select public.family_balance($1)", [family]),
    "100000.00",
  );
  assert.equal(
    await scalar(
      "select count(*) from public.audit_logs where family_id=$1 and entity_type='transactions'",
      [family],
    ),
    0,
  );
});
await assert.rejects(
  asUser(other, foreign, () =>
    scalar(
      "insert into public.transactions(family_id,user_id,wallet_id,type,amount,transaction_date) values($1,$2,$3,'income',10,'2026-10-01') returning id",
      [foreign, other, wallet],
    ),
  ),
);
await assert.rejects(
  asUser(sari, family, () =>
    scalar(
      "insert into public.wallets(family_id,name,type) values($1,'Tidak boleh','shared') returning id",
      [family],
    ),
  ),
);
await assert.rejects(
  asUser(sari, family, () =>
    scalar("update public.users set role='owner' where id=$1 returning id", [
      sari,
    ]),
  ),
);
await assert.rejects(
  asUser(budi, family, () =>
    scalar("delete from public.audit_logs where family_id=$1 returning id", [
      family,
    ]),
  ),
);
const goal = await asUser(budi, family, () =>
  scalar(
    "insert into public.saving_goals(family_id,created_by_user_id,name,target_amount) values($1,$2,'Dana Darurat',50000) returning id",
    [family, budi],
  ),
);
await asUser(budi, family, () =>
  scalar(
    "insert into public.saving_contributions(goal_id,user_id,wallet_id,amount) values($1,$2,$3,50000) returning id",
    [goal, budi, personal],
  ),
);
await asUser(sari, family, async () => {
  assert.equal(
    await scalar(
      "select status from public.saving_goals where family_id=$1 and id=$2",
      [family, goal],
    ),
    "achieved",
  );
  assert.equal(
    await scalar("select wallet_id from public.goal_contributions($1)", [
      family,
    ]),
    null,
  );
});
await assert.rejects(
  asUser(budi, family, () =>
    scalar(
      "insert into public.saving_contributions(goal_id,user_id,wallet_id,amount) values($1,$2,$3,60000) returning id",
      [goal, budi, personal],
    ),
  ),
);
// Transfer tetap netral pada total keluarga, tetapi detail pribadi hanya untuk pemilik.
await asUser(budi, family, () =>
  scalar(
    "insert into public.transactions(family_id,user_id,wallet_id,to_wallet_id,type,amount,transaction_date) values($1,$2,$3,$4,'transfer',10000,'2026-10-01') returning id",
    [family, budi, personal, wallet],
  ),
);
await asUser(sari, family, async () => {
  assert.equal(
    await scalar("select public.wallet_balance($1,$2)", [wallet, family]),
    "10000.00",
  );
  assert.equal(
    await scalar("select public.family_balance($1)", [family]),
    "50000.00",
  );
});
await assert.rejects(
  asUser(budi, family, () =>
    scalar(
      "insert into public.transactions(family_id,user_id,wallet_id,to_wallet_id,type,amount,transaction_date) values($1,$2,$3,$3,'transfer',10,'2026-10-01') returning id",
      [family, budi, wallet],
    ),
  ),
);
const cat = await asUser(budi, family, () =>
  scalar(
    "insert into public.categories(family_id,name,type) values($1,'Perawatan Rumah','expense') returning id",
    [family],
  ),
);
const receipt = `${family}/${budi}/123-test.jpg`;
await asUser(budi, family, () =>
  scalar(
    "insert into storage.objects(bucket_id,name) values('receipts',$1) returning name",
    [receipt],
  ),
);
await asUser(sari, family, async () =>
  assert.equal(
    await scalar("select count(*) from storage.objects where name=$1", [
      receipt,
    ]),
    0,
  ),
);
const sharedTx = await asUser(budi, family, () =>
  scalar(
    "insert into public.transactions(family_id,user_id,wallet_id,category_id,type,amount,transaction_date,receipt_url) values($1,$2,$3,$4,'expense',1000,'2026-10-01',$5) returning id",
    [family, budi, wallet, cat, receipt],
  ),
);
await asUser(sari, family, async () =>
  assert.equal(
    await scalar("select count(*) from storage.objects where name=$1", [
      receipt,
    ]),
    1,
  ),
);
await asUser(other, foreign, async () =>
  assert.equal(
    await scalar("select count(*) from storage.objects where name=$1", [
      receipt,
    ]),
    0,
  ),
);
await asUser(budi, family, () =>
  scalar(
    "delete from public.categories where family_id=$1 and id=$2 returning id",
    [family, cat],
  ),
);
await asUser(sari, family, async () =>
  assert.equal(
    await scalar(
      "select c.name from public.transactions t join public.categories c on c.id=t.category_id and c.family_id=t.family_id where t.family_id=$1 and t.id=$2",
      [family, sharedTx],
    ),
    "Lainnya",
  ),
);
await assert.rejects(
  asUser(budi, family, () =>
    scalar(
      "update public.wallets set family_id=$1 where family_id=$2 and id=$3 returning id",
      [foreign, family, wallet],
    ),
  ),
);
await assert.rejects(
  asUser(budi, family, () =>
    scalar(
      "delete from public.saving_goals where family_id=$1 and id=$2 returning id",
      [family, goal],
    ),
  ),
);
await asUser(budi, family, async () => {
  await scalar(
    "update public.saving_goals set current_amount=999999 where family_id=$1 and id=$2 returning id",
    [family, goal],
  );
  assert.equal(
    await scalar(
      "select current_amount from public.saving_goals where family_id=$1 and id=$2",
      [family, goal],
    ),
    "50000.00",
  );
});
// Migrasi data lama yang sudah berisi dompet pribadi dan kontribusi.
await db.exec("begin");
await db.exec(
  readFileSync("supabase/migrations/0003_tabungan_dompet_bersama.sql", "utf8"),
);
await db.exec("commit");
const linked = await asUser(sari, family, () =>
  scalar(
    "select wallet_id from public.saving_goals where family_id=$1 and id=$2",
    [family, goal],
  ),
);
await asUser(sari, family, async () => {
  assert.equal(
    await scalar(
      "select type from public.wallets where family_id=$1 and id=$2",
      [family, personal],
    ),
    "shared",
  );
  assert.equal(
    await scalar(
      "select is_primary from public.wallets where family_id=$1 and id=$2",
      [family, wallet],
    ),
    true,
  );
  assert.equal(
    await scalar("select public.wallet_balance($1,$2)", [personal, family]),
    "40000.00",
  );
  assert.equal(
    await scalar("select public.wallet_balance($1,$2)", [linked, family]),
    "50000.00",
  );
  assert.equal(
    await scalar("select public.family_balance($1)", [family]),
    "99000.00",
  );
});
const newWallet = await asUser(sari, family, () =>
  scalar(
    "insert into public.wallets(family_id,name) values($1,'Dompet Liburan') returning id",
    [family],
  ),
);
await assert.rejects(
  asUser(sari, family, () =>
    scalar(
      "insert into public.wallets(family_id,name,type,owner_user_id) values($1,'Pribadi','personal',$2) returning id",
      [family, sari],
    ),
  ),
);
await assert.rejects(
  asUser(sari, family, () =>
    scalar(
      "delete from public.wallets where family_id=$1 and id=$2 returning id",
      [family, wallet],
    ),
  ),
);
await assert.rejects(
  asUser(sari, family, () =>
    scalar(
      "update public.wallets set is_primary=false where family_id=$1 and id=$2 returning id",
      [family, wallet],
    ),
  ),
);
await assert.rejects(
  asUser(sari, family, () =>
    scalar(
      "insert into public.saving_contributions(goal_id,user_id,wallet_id,amount) values($1,$2,$3,1) returning id",
      [goal, sari, personal],
    ),
  ),
);
await assert.rejects(
  asUser(other, foreign, () =>
    scalar("select public.wallet_ledger($1,$2)", [linked, family]),
  ),
);
await assert.rejects(
  asUser(other, foreign, () =>
    scalar(
      "insert into public.saving_goals(family_id,created_by_user_id,wallet_id,name,target_amount) values($1,$2,$3,'Lintas keluarga',100) returning id",
      [foreign, other, linked],
    ),
  ),
);
await assert.rejects(
  asUser(sari, family, () =>
    scalar(
      "insert into public.saving_goals(family_id,created_by_user_id,wallet_id,name,target_amount) values($1,$2,$3,'Duplikat',100) returning id",
      [family, sari, linked],
    ),
  ),
);
const savingTx = await asUser(sari, family, () =>
  scalar(
    "insert into public.transactions(family_id,user_id,wallet_id,to_wallet_id,type,amount,transaction_date) values($1,$2,$3,$4,'transfer',1000,'2026-10-02') returning id",
    [family, sari, wallet, linked],
  ),
);
async function assertGoal(amount: string, status: string) {
  await asUser(sari, family, async () => {
    assert.equal(
      await scalar(
        "select current_amount from public.saving_goals where family_id=$1 and id=$2",
        [family, goal],
      ),
      amount,
    );
    assert.equal(
      await scalar(
        "select status from public.saving_goals where family_id=$1 and id=$2",
        [family, goal],
      ),
      status,
    );
  });
}
await assertGoal("51000.00", "achieved");
await asUser(sari, family, () =>
  scalar(
    "update public.transactions set amount=2000 where family_id=$1 and id=$2 returning id",
    [family, savingTx],
  ),
);
await assertGoal("52000.00", "achieved");
await asUser(sari, family, () =>
  scalar(
    "delete from public.transactions where family_id=$1 and id=$2 returning id",
    [family, savingTx],
  ),
);
await assertGoal("50000.00", "achieved");
const outbound = await asUser(sari, family, () =>
  scalar(
    "insert into public.transactions(family_id,user_id,wallet_id,to_wallet_id,type,amount,transaction_date) values($1,$2,$3,$4,'transfer',1000,'2026-10-02') returning id",
    [family, sari, linked, wallet],
  ),
);
await assertGoal("49000.00", "active");
await asUser(sari, family, () =>
  scalar(
    "update public.transactions set wallet_id=$3 where family_id=$1 and id=$2 returning id",
    [family, outbound, personal],
  ),
);
await assertGoal("50000.00", "achieved");
await asUser(sari, family, () =>
  scalar(
    "delete from public.transactions where family_id=$1 and id=$2 returning id",
    [family, outbound],
  ),
);
await asUser(sari, family, () =>
  scalar(
    "update public.saving_goals set wallet_id=$3,current_amount=999999,status='achieved' where family_id=$1 and id=$2 returning id",
    [family, goal, newWallet],
  ),
);
await assertGoal("0.00", "active");
await asUser(sari, family, () =>
  scalar(
    "update public.saving_goals set wallet_id=$3,status='archived' where family_id=$1 and id=$2 returning id",
    [family, goal, linked],
  ),
);
await assertGoal("50000.00", "archived");
await asUser(sari, family, () =>
  scalar(
    "insert into public.saving_goals(family_id,created_by_user_id,wallet_id,name,target_amount) values($1,$2,$3,'Target berikutnya',60000) returning id",
    [family, sari, linked],
  ),
);
await assert.rejects(
  asUser(sari, family, () =>
    scalar(
      "delete from public.wallets where family_id=$1 and id=$2 returning id",
      [family, linked],
    ),
  ),
);
await asUser(other, foreign, async () => {
  assert.equal(
    await scalar(
      "select count(*) from public.saving_goals where family_id=$1",
      [family],
    ),
    0,
  );
  assert.equal(
    await scalar("select count(*) from public.audit_logs where family_id=$1", [
      family,
    ]),
    0,
  );
  assert.equal(
    await scalar("select public.wallet_balance($1,$2)", [linked, family]),
    "0",
  );
});
const fresh = await asUser(extra, null, () =>
  scalar("select public.create_family('Keluarga Baru')"),
);
await asUser(extra, fresh, async () =>
  assert.equal(
    await scalar(
      "select name from public.wallets where family_id=$1 and is_primary",
      [fresh],
    ),
    "Dompet Keluarga",
  ),
);
// Pemeriksaan saldo dilakukan sebelum mutasi, termasuk edit/hapus dana yang telah dipakai.
await db.exec(
  readFileSync("supabase/migrations/0004_cegah_saldo_minus.sql", "utf8"),
);
const emptyWallet = await asUser(extra, fresh, () =>
  scalar("select id from public.wallets where family_id=$1 and is_primary", [
    fresh,
  ]),
);
const destination = await asUser(extra, fresh, () =>
  scalar(
    "insert into public.wallets(family_id,name) values($1,'Liburan') returning id",
    [fresh],
  ),
);
const transferSql =
  "insert into public.transactions(family_id,user_id,wallet_id,to_wallet_id,type,amount,transaction_date) values($1,$2,$3,$4,'transfer',$5,'2026-10-02') returning id";
const saving = await asUser(extra, fresh, () =>
  scalar(
    "insert into public.saving_goals(family_id,created_by_user_id,wallet_id,name,target_amount) values($1,$2,$3,'Liburan',100) returning id",
    [fresh, extra, destination],
  ),
);
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(transferSql, [fresh, extra, emptyWallet, destination, 1]),
  ),
  /Saldo dompet belum mencukupi/,
);
await asUser(extra, fresh, async () =>
  assert.equal(
    await scalar(
      "select count(*) from public.transactions where family_id=$1",
      [fresh],
    ),
    0,
  ),
);
const funding = await asUser(extra, fresh, () =>
  scalar(
    "insert into public.transactions(family_id,user_id,wallet_id,type,amount,transaction_date) values($1,$2,$3,'income',100,'2026-10-02') returning id",
    [fresh, extra, emptyWallet],
  ),
);
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(transferSql, [fresh, extra, emptyWallet, destination, 100.01]),
  ),
  /Saldo dompet belum mencukupi/,
);
const fullTransfer = await asUser(extra, fresh, () =>
  scalar(transferSql, [fresh, extra, emptyWallet, destination, 100]),
);
await asUser(extra, fresh, async () => {
  assert.equal(
    await scalar("select public.wallet_balance($1,$2)", [emptyWallet, fresh]),
    "0.00",
  );
  assert.equal(
    await scalar(
      "select current_amount from public.saving_goals where family_id=$1 and id=$2",
      [fresh, saving],
    ),
    "100.00",
  );
});
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(
      "update public.transactions set amount=101 where family_id=$1 and id=$2 returning id",
      [fresh, fullTransfer],
    ),
  ),
  /Saldo dompet belum mencukupi/,
);
await asUser(extra, fresh, () =>
  scalar(
    "update public.transactions set description='Ubah catatan saat saldo nol' where family_id=$1 and id=$2 returning id",
    [fresh, fullTransfer],
  ),
);
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(
      "delete from public.transactions where family_id=$1 and id=$2 returning id",
      [fresh, funding],
    ),
  ),
  /Saldo dompet belum mencukupi/,
);
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(
      "update public.transactions set amount=50 where family_id=$1 and id=$2 returning id",
      [fresh, funding],
    ),
  ),
  /Saldo dompet belum mencukupi/,
);
const spent = await asUser(extra, fresh, () =>
  scalar(
    "insert into public.transactions(family_id,user_id,wallet_id,type,amount,transaction_date) values($1,$2,$3,'expense',70,'2026-10-02') returning id",
    [fresh, extra, destination],
  ),
);
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(
      "delete from public.transactions where family_id=$1 and id=$2 returning id",
      [fresh, fullTransfer],
    ),
  ),
  /Saldo dompet belum mencukupi/,
);
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(
      "update public.transactions set amount=60 where family_id=$1 and id=$2 returning id",
      [fresh, fullTransfer],
    ),
  ),
  /Saldo dompet belum mencukupi/,
);
await asUser(extra, fresh, () =>
  scalar(
    "delete from public.transactions where family_id=$1 and id=$2 returning id",
    [fresh, spent],
  ),
);
await asUser(extra, fresh, () =>
  scalar(
    "delete from public.transactions where family_id=$1 and id=$2 returning id",
    [fresh, fullTransfer],
  ),
);
await asUser(extra, fresh, async () =>
  assert.equal(
    await scalar("select public.wallet_balance($1,$2)", [emptyWallet, fresh]),
    "100.00",
  ),
);
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(
      "insert into public.transactions(family_id,user_id,wallet_id,type,amount,transaction_date) values($1,$2,$3,'expense',101,'2026-10-02') returning id",
      [fresh, extra, emptyWallet],
    ),
  ),
  /Saldo dompet belum mencukupi/,
);
// Emulasi kondisi minus lama, lalu buktikan perbaikan diizinkan tanpa memperburuknya.
await db.exec("alter table public.transactions disable trigger guard_balance");
const badTransfer = await asUser(extra, fresh, () =>
  scalar(transferSql, [fresh, extra, emptyWallet, destination, 150]),
);
await db.exec("alter table public.transactions enable trigger guard_balance");
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(transferSql, [fresh, extra, emptyWallet, destination, 1]),
  ),
  /Saldo dompet belum mencukupi/,
);
await asUser(extra, fresh, () =>
  scalar(
    "update public.transactions set amount=125 where family_id=$1 and id=$2 returning id",
    [fresh, badTransfer],
  ),
);
await asUser(extra, fresh, () =>
  scalar(
    "delete from public.transactions where family_id=$1 and id=$2 returning id",
    [fresh, badTransfer],
  ),
);
await asUser(extra, fresh, async () =>
  assert.equal(
    await scalar("select public.wallet_balance($1,$2)", [emptyWallet, fresh]),
    "100.00",
  ),
);
// Dua debit dalam satu statement juga tidak boleh melampaui saldo gabungan.
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(
      "insert into public.transactions(family_id,user_id,wallet_id,to_wallet_id,type,amount,transaction_date) values($1,$2,$3,$4,'transfer',70,'2026-10-03'),($1,$2,$3,$4,'transfer',70,'2026-10-03') returning id",
      [fresh, extra, emptyWallet, destination],
    ),
  ),
  /Saldo dompet belum mencukupi/,
);
await asUser(extra, fresh, async () =>
  assert.equal(
    await scalar("select public.wallet_balance($1,$2)", [emptyWallet, fresh]),
    "100.00",
  ),
);
console.log(
  "Lulus: saldo nol/kurang ditolak, transfer pas saldo, edit tanpa debit ganda, perlindungan hapus dana terpakai, dan koreksi minus lama.",
);
console.log(
  "Lulus: migrasi kontribusi lama, saldo netral transfer, progres CRUD, dompet utama, akses pasangan, target unik, arsip dan isolasi keluarga.",
);
await asUser(budi, family, () =>
  scalar("select public.remove_member($1)", [sari]),
);
await asUser(sari, family, async () =>
  assert.equal(
    await scalar("select count(*) from public.wallets where family_id=$1", [
      family,
    ]),
    0,
  ),
);
console.log(
  "Lulus: migrasi, seed, batas anggota, JWT palsu, isolasi keluarga/dompet/audit, kontribusi, dan pencabutan akses.",
);
await db.exec(
  readFileSync(
    "supabase/migrations/0005_budget_dan_form_transaksi.sql",
    "utf8",
  ),
);
const food = await asUser(extra, fresh, () =>
  scalar(
    "select id from public.categories where family_id=$1 and name='Makan & Minum'",
    [fresh],
  ),
);
await asUser(extra, fresh, async () => {
  assert.equal(
    await scalar(
      "update public.categories set monthly_budget=2000000 where family_id=$1 and id=$2 returning monthly_budget",
      [fresh, food],
    ),
    "2000000.00",
  );
  assert.equal(
    await scalar(
      "select count(*) from public.audit_logs where family_id=$1 and entity_id=$2 and after_data->>'monthly_budget' is not null",
      [fresh, food],
    ),
    1,
  );
});
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(
      "update public.categories set monthly_budget=-1 where family_id=$1 and id=$2 returning id",
      [fresh, food],
    ),
  ),
  /category_monthly_budget_valid/,
);
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(
      "update public.categories set monthly_budget=10 where family_id=$1 and type='income' returning id",
      [fresh],
    ),
  ),
  /category_monthly_budget_valid/,
);
await asUser(other, foreign, async () => {
  assert.equal(
    await scalar(
      "select count(*) from public.categories where family_id=$1 and monthly_budget is not null",
      [fresh],
    ),
    0,
  );
  assert.equal(
    await scalar(
      "update public.categories set monthly_budget=100 where family_id=$1 and id=$2 returning id",
      [fresh, food],
    ),
    undefined,
  );
});
const budgetExpense = await asUser(extra, fresh, () =>
  scalar(
    "insert into public.transactions(family_id,user_id,wallet_id,category_id,type,amount,transaction_date,receipt_url,receipt_ocr_data) values($1,$2,$3,$4,'expense',10,'2026-10-03',$5,'{\"total\":10}') returning id",
    [fresh, extra, emptyWallet, food, `${fresh}/${extra}/test.png`],
  ),
);
await asUser(extra, fresh, async () => {
  assert.equal(
    await scalar(
      "select receipt_ocr_data->>'total' from public.transactions where family_id=$1 and id=$2",
      [fresh, budgetExpense],
    ),
    "10",
  );
  assert.equal(
    await scalar(
      "update public.transactions set type='income',category_id=null where family_id=$1 and id=$2 returning receipt_url",
      [fresh, budgetExpense],
    ),
    null,
  );
  assert.equal(
    await scalar(
      "select receipt_ocr_data from public.transactions where family_id=$1 and id=$2",
      [fresh, budgetExpense],
    ),
    null,
  );
  const transfer = await scalar(transferSql, [
    fresh,
    extra,
    emptyWallet,
    destination,
    1,
  ]);
  assert.equal(
    await scalar(
      "update public.transactions set description='Catatan tersembunyi',receipt_url=$3 where family_id=$1 and id=$2 returning description",
      [fresh, transfer, `${fresh}/${extra}/test.png`],
    ),
    "Transfer antar dompet",
  );
  assert.equal(
    await scalar(
      "select receipt_url from public.transactions where family_id=$1 and id=$2",
      [fresh, transfer],
    ),
    null,
  );
});
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(
      "update public.saving_goals set status='archived' where family_id=$1 and id=$2 returning id",
      [fresh, saving],
    ),
  ),
  /Fitur arsip target tidak tersedia/,
);
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(
      "insert into public.saving_goals(family_id,created_by_user_id,wallet_id,name,target_amount) values($1,$2,$3,'Duplikat',100) returning id",
      [fresh, extra, destination],
    ),
  ),
  /Dompet sudah digunakan oleh target lain/,
);
// Sebuah arsip lama sendiri tetap memesan dompet, walau indeks lama hanya mencakup target aktif.
const legacyWallet = await asUser(extra, fresh, () =>
  scalar(
    "insert into public.wallets(family_id,name) values($1,'Riwayat target lama') returning id",
    [fresh],
  ),
);
await db.exec(
  "alter table public.saving_goals disable trigger guard_goal_link",
);
await asUser(extra, fresh, () =>
  scalar(
    "insert into public.saving_goals(family_id,created_by_user_id,wallet_id,name,target_amount,status) values($1,$2,$3,'Target lama',100,'archived') returning id",
    [fresh, extra, legacyWallet],
  ),
);
await db.exec("alter table public.saving_goals enable trigger guard_goal_link");
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(
      "insert into public.saving_goals(family_id,created_by_user_id,wallet_id,name,target_amount) values($1,$2,$3,'Target baru',100) returning id",
      [fresh, extra, legacyWallet],
    ),
  ),
  /Dompet sudah digunakan oleh target lain/,
);
await assert.rejects(
  asUser(extra, fresh, () =>
    scalar(
      "update public.saving_goals set wallet_id=$3 where family_id=$1 and id=$2 returning id",
      [fresh, saving, legacyWallet],
    ),
  ),
  /Dompet sudah digunakan oleh target lain/,
);
console.log(
  "Lulus: budget tersimpan dan terisolasi, struk hanya pengeluaran, transfer tanpa catatan, arsip baru ditolak, dompet target/arsip lama tidak dapat dipakai ulang.",
);
await db.exec(
  readFileSync("supabase/migrations/0006_keamanan_dan_indeks.sql", "utf8"),
);
await asUser(extra, fresh, async () => {
  await db.query("update public.users set avatar_url=$2 where id=$1", [
    extra,
    "data:image/png;base64,AAAA",
  ]);
  const log = await db.query<{
    before_data: Record<string, unknown>;
    after_data: Record<string, unknown>;
  }>(
    "select before_data,after_data from public.audit_logs where family_id=$1 and entity_id=$2 order by created_at desc limit 1",
    [fresh, extra],
  );
  assert.equal(log.rows[0].after_data.avatar_url, undefined);
  assert.equal(log.rows[0].before_data.avatar_url, undefined);
  assert.equal(
    await scalar("select avatar_url from public.users where id=$1", [extra]),
    "data:image/png;base64,AAAA",
  );
  const sums = await db.query<{ wallet_id: string; balance: string }>(
    `select wallet_id,sum(delta) as balance from (
    select wallet_id,case when type='income' then amount else -amount end as delta from public.transactions where family_id=$1
    union all select to_wallet_id,amount from public.transactions where family_id=$1 and type='transfer'
  ) ledger group by wallet_id`,
    [fresh],
  );
  for (const row of sums.rows)
    assert.equal(
      Number(row.balance),
      Number(
        await scalar("select public.wallet_balance($1,$2)", [
          row.wallet_id,
          fresh,
        ]),
      ),
    );
});
await assert.rejects(
  asUser(extra, fresh, () =>
    db.query("update public.users set avatar_url=$2 where id=$1", [
      extra,
      "x".repeat(400001),
    ]),
  ),
  /profile_payload_size/,
);
await assert.rejects(
  asUser(extra, fresh, () =>
    db.query(
      "update public.transactions set description=$2 where family_id=$1 and type='income'",
      [fresh, "x".repeat(2001)],
    ),
  ),
  /transaction_payload_size/,
);
await asUser(other, foreign, async () => {
  assert.equal(
    await scalar("select count(*) from public.audit_logs where family_id=$1", [
      fresh,
    ]),
    0,
  );
});
console.log(
  "Lulus: payload besar ditolak pada database, audit tidak menyalin avatar, saldo agregat cocok dengan ledger, isolasi audit tetap berlaku.",
);
const bulkWallet = await asUser(extra, fresh, () =>
  scalar(
    "insert into public.wallets(family_id,name) values($1,'Uji debit batch') returning id",
    [fresh],
  ),
);
await asUser(extra, fresh, () =>
  db.query(
    "insert into public.transactions(family_id,user_id,wallet_id,type,amount,transaction_date) values($1,$2,$3,'income',100,'2026-10-01')",
    [fresh, extra, bulkWallet],
  ),
);
await assert.rejects(
  asUser(extra, fresh, () =>
    db.query(
      `insert into public.transactions(family_id,user_id,wallet_id,to_wallet_id,type,amount,transaction_date)
  values($1,$2,$3,$4,'transfer',60,'2026-10-02'),($1,$2,$3,$4,'transfer',60,'2026-10-02')`,
      [fresh, extra, bulkWallet, destination],
    ),
  ),
  /Saldo dompet belum mencukupi/,
);
await asUser(extra, fresh, () =>
  scalar("select public.wallet_balance($1,$2)", [bulkWallet, fresh]).then(
    (balance) => assert.equal(Number(balance), 100),
  ),
);
console.log(
  "Lulus: dua debit dalam satu statement tidak dapat melewati saldo; seluruh batch rollback.",
);
await db.exec(
  readFileSync("supabase/migrations/0007_batas_tulis_database.sql", "utf8"),
);
for (let i = 0; i < 60; i++)
  await asUser(extra, fresh, () =>
    db.query("update public.users set name='Uji batas database' where id=$1", [
      extra,
    ]),
  );
await assert.rejects(
  asUser(extra, fresh, () =>
    db.query("update public.users set name='Request ke-61' where id=$1", [
      extra,
    ]),
  ),
  /Terlalu banyak perubahan/,
);
await asUser(other, foreign, () =>
  db.query(
    "update public.users set name='Keluarga lain tetap bekerja' where id=$1",
    [other],
  ),
);
await assert.rejects(
  asUser(extra, fresh, () =>
    db.query("select * from duitkita_private.write_limits"),
  ),
  /permission denied/,
);
console.log(
  "Lulus: jalur database membatasi request tulis, keluarga lain tidak terblokir, counter privat tidak dapat dibaca pengguna.",
);
const walletCount = await asUser(other, foreign, () =>
  scalar("select count(*) from public.wallets where family_id=$1", [foreign]),
);
await assert.rejects(
  asUser(other, foreign, () =>
    db.query(
      "insert into public.wallets(family_id,name) select $1,'Batch '||n from generate_series(1,61) n",
      [foreign],
    ),
  ),
  /Terlalu banyak perubahan/,
);
assert.equal(
  await asUser(other, foreign, () =>
    scalar("select count(*) from public.wallets where family_id=$1", [foreign]),
  ),
  walletCount,
);
console.log(
  "Lulus: batch besar tidak melewati limiter database dan tidak meninggalkan baris parsial.",
);
await db.close();
