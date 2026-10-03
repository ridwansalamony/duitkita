-- Satu ledger transaksi untuk seluruh dompet dan target keluarga.
-- Migrasi atomik: riwayat kontribusi tetap disimpan, tidak dihitung dua kali.
lock table public.wallets, public.transactions, public.saving_goals, public.saving_contributions in access exclusive mode;
create temporary table duitkita_balance_before on commit drop as
 select w.id,w.family_id,
 coalesce((select sum(case when t.wallet_id=w.id then case when t.type='income' then t.amount else -t.amount end else 0 end + case when t.to_wallet_id=w.id then t.amount else 0 end) from public.transactions t where t.family_id=w.family_id and (t.wallet_id=w.id or t.to_wallet_id=w.id)),0)
 -coalesce((select sum(c.amount) from public.saving_contributions c join public.saving_goals g on g.id=c.goal_id where g.family_id=w.family_id and c.wallet_id=w.id),0) as balance
 from public.wallets w;
alter table public.wallets add column is_primary boolean not null default false;
alter table public.saving_goals add column wallet_id uuid references public.wallets(id) on delete restrict;
alter table public.wallets disable trigger guard_wallet;
update public.wallets set type='shared',owner_user_id=null where type='personal';
update public.wallets w set is_primary=true from (
 select distinct on(family_id) id from public.wallets
 order by family_id,case when name in ('Dompet Keluarga','Dompet Rumah Tangga') then 0 else 1 end,created_at,id
) chosen where w.id=chosen.id;
update public.wallets set name='Dompet Keluarga' where is_primary and name='Dompet Rumah Tangga';
insert into public.wallets(family_id,name,is_primary)
 select f.id,'Dompet Keluarga',true from public.families f where not exists(select 1 from public.wallets w where w.family_id=f.id);
alter table public.wallets enable trigger guard_wallet;
alter table public.wallets add constraint shared_wallet_only check(type='shared' and owner_user_id is null);
create unique index wallet_primary_family_idx on public.wallets(family_id) where is_primary;

-- Setiap target lama mendapat dompet khusus untuk mempertahankan saldo.
alter table public.saving_goals disable trigger guard_goal;
alter table public.transactions disable trigger guard_tx;
do $$ declare g record; w uuid; begin
 for g in select id,family_id,name from public.saving_goals loop
  insert into public.wallets(family_id,name,type) values(g.family_id,left('Tabungan '||g.name,120),'shared') returning id into w;
  update public.saving_goals set wallet_id=w where id=g.id and family_id=g.family_id;
  insert into public.transactions(id,family_id,user_id,wallet_id,to_wallet_id,type,amount,description,transaction_date,created_at)
   select c.id,g.family_id,c.user_id,coalesce(c.wallet_id,w),case when c.wallet_id is null then null else w end,
    case when c.wallet_id is null then 'income'::public.tx_type else 'transfer'::public.tx_type end,
    c.amount,coalesce(c.note,'Tabungan keluarga'),(c.contributed_at at time zone 'Asia/Jakarta')::date,c.contributed_at
   from public.saving_contributions c where c.goal_id=g.id;
 end loop;
end $$;
alter table public.transactions enable trigger guard_tx;
alter table public.saving_goals enable trigger guard_goal;
alter table public.saving_goals alter column wallet_id set not null;
create unique index goal_wallet_open_idx on public.saving_goals(family_id,wallet_id) where status<>'archived';
-- Hubungan komposit mencegah referensi dompet lintas keluarga, termasuk melalui REST.
alter table public.wallets add constraint wallet_id_family_unique unique(id,family_id);
alter table public.saving_goals add constraint goal_wallet_family_fk foreign key(wallet_id,family_id) references public.wallets(id,family_id) on delete restrict;
revoke insert,update,delete on public.saving_contributions from authenticated;
drop policy contribution_add on public.saving_contributions;
drop trigger contribution_total on public.saving_contributions;

create function public.wallet_ledger(w uuid,f uuid) returns numeric language sql stable security definer set search_path='' as $$
 select coalesce(sum(case when wallet_id=w then case when type='income' then amount else -amount end else 0 end
 +case when to_wallet_id=w and type='transfer' then amount else 0 end),0)
 from public.transactions where family_id=f and (wallet_id=w or to_wallet_id=w)
$$;
revoke all on function public.wallet_ledger(uuid,uuid) from public,anon,authenticated;
create or replace function public.can_wallet(w uuid,f uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.in_family(f) and exists(select 1 from public.wallets where id=w and family_id=f)
$$;
create or replace function public.wallet_balance(w uuid,f uuid) returns numeric language sql stable security definer set search_path='' as $$
 select case when public.in_family(f) and public.can_wallet(w,f) then public.wallet_ledger(w,f) else 0 end
$$;
create or replace function public.family_balance(f uuid) returns numeric language sql stable security definer set search_path='' as $$
 select case when public.in_family(f) then coalesce((select sum(case when type='income' then amount when type='expense' then -amount else 0 end) from public.transactions where family_id=f),0) else null end
$$;
create or replace function public.guard_finance() returns trigger language plpgsql security definer set search_path='' as $$
declare f uuid; g public.saving_goals; w public.wallets;
begin
 if tg_op='UPDATE' and (to_jsonb(new)->>'family_id') is distinct from (to_jsonb(old)->>'family_id') then raise exception 'Keluarga tidak dapat dipindahkan'; end if;
 if tg_table_name='wallets' then
   if tg_op='UPDATE' and (new.type<>old.type or new.owner_user_id is distinct from old.owner_user_id) then raise exception 'Kepemilikan dompet tidak dapat diubah'; end if;
   if new.owner_user_id is not null and not exists(select 1 from public.users where id=new.owner_user_id and family_id=new.family_id) then raise exception 'Pemilik dompet tidak valid'; end if;
 elsif tg_table_name='transactions' then
   if tg_op='UPDATE' and new.user_id<>old.user_id then raise exception 'Pencatat tidak dapat diubah'; end if;
   if tg_op='INSERT' and new.user_id<>auth.uid() then raise exception 'Pencatat tidak valid'; end if;
   if not exists(select 1 from public.wallets where id=new.wallet_id and family_id=new.family_id) or (new.to_wallet_id is not null and not exists(select 1 from public.wallets where id=new.to_wallet_id and family_id=new.family_id)) then raise exception 'Dompet berbeda keluarga'; end if;
   if new.category_id is not null and not exists(select 1 from public.categories where id=new.category_id and family_id=new.family_id and type=new.type) then raise exception 'Kategori tidak sesuai'; end if;
   if new.receipt_url is not null and (tg_op='INSERT' or new.receipt_url is distinct from old.receipt_url) and (split_part(new.receipt_url,'/',1)<>new.family_id::text or split_part(new.receipt_url,'/',2)<>auth.uid()::text) then raise exception 'Lampiran tidak valid'; end if;
   new.updated_at:=now();
 elsif tg_table_name='saving_goals' then
   if tg_op='INSERT' and new.created_by_user_id<>auth.uid() then raise exception 'Pembuat target tidak valid'; end if;
   if tg_op='UPDATE' and new.created_by_user_id<>old.created_by_user_id then raise exception 'Pembuat target tidak dapat diubah'; end if;
   if not exists(select 1 from public.wallets where id=new.wallet_id and family_id=new.family_id) then raise exception 'Dompet target berbeda keluarga'; end if;
   new.current_amount:=public.wallet_ledger(new.wallet_id,new.family_id);
   if new.status<>'archived' then new.status:=case when new.current_amount>=new.target_amount then 'achieved'::public.goal_status else 'active'::public.goal_status end; end if;
 elsif tg_table_name='saving_contributions' then
   select * into g from public.saving_goals where id=new.goal_id for update;
   if g.id is null or g.status='archived' then raise exception 'Target tidak aktif'; end if;
   select * into w from public.wallets where id=new.wallet_id and family_id=g.family_id for update;
   if w.id is null or not public.can_wallet(w.id,g.family_id) or new.user_id<>auth.uid() then raise exception 'Dompet kontribusi tidak valid'; end if;
   if public.wallet_balance(w.id,g.family_id)<new.amount then raise exception 'Saldo dompet belum mencukupi'; end if;
 elsif tg_table_name='categories' and tg_op='UPDATE' then
   if old.is_default and (not new.is_default or (old.name='Lainnya' and (new.name<>old.name or new.type<>old.type))) then raise exception 'Kategori Lainnya tetap diperlukan'; end if;
   if new.type<>old.type and exists(select 1 from public.transactions where category_id=old.id and family_id=old.family_id) then raise exception 'Jenis kategori yang terpakai tidak dapat diubah'; end if;
 end if;
 return new;
end $$;
create or replace function public.create_family(family_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare f uuid; existing uuid;
begin
 if auth.uid() is null or length(trim(family_name)) not between 2 and 120 then raise exception 'Nama keluarga tidak valid'; end if;
 select family_id into existing from public.users where id=auth.uid() for update;
 if not found or existing is not null then raise exception 'Akun sudah memiliki keluarga'; end if;
 insert into public.families(name,invite_code,invite_expires_at) values(trim(family_name),upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),now()+interval '7 days') returning id into f;
 update public.users set family_id=f,role='owner' where id=auth.uid();
 insert into public.wallets(family_id,name,type,is_primary) values(f,'Dompet Keluarga','shared',true);
 insert into public.categories(family_id,name,type,icon,color,is_default)
 select f,n,t::public.tx_type,i,c,true from (values
 ('Makan & Minum','expense','utensils','#f59e0b'),('Transportasi','expense','car','#3b82f6'),
 ('Belanja Bulanan','expense','shopping-bag','#ec4899'),('Tagihan & Utilitas','expense','receipt','#8b5cf6'),
 ('Kesehatan','expense','heart','#ef4444'),('Hiburan','expense','coffee','#f97316'),
 ('Gaji','income','briefcase','#10b981'),('Bonus','income','gift','#06b6d4'),('Freelance','income','laptop','#6366f1'),
 ('Pendidikan Anak','expense','graduation-cap','#14b8a6'),('Zakat & Donasi','expense','heart-handshake','#a855f7'),
 ('Lainnya','expense','tag','#64748b'),('Lainnya','income','tag','#64748b')) as defaults(n,t,i,c);
 return f;
end $$;
-- Seluruh anggota mengelola dompet keluarga yang sama.
drop policy wallet_read on public.wallets;
drop policy wallet_add on public.wallets;
drop policy wallet_edit on public.wallets;
drop policy wallet_remove on public.wallets;
create policy wallet_access on public.wallets for all to authenticated using(public.in_family(family_id)) with check(public.in_family(family_id));
drop policy audit_read on public.audit_logs;
create policy audit_read on public.audit_logs for select to authenticated using(public.in_family(family_id));

create function public.protect_primary_wallet() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' then
  if old.is_primary then raise exception 'Dompet utama tidak dapat dihapus'; end if;
  return old;
 end if;
 if tg_op='UPDATE' and new.is_primary is distinct from old.is_primary then raise exception 'Dompet utama tidak dapat diganti'; end if;
 if tg_op='INSERT' and new.is_primary and exists(select 1 from public.wallets where family_id=new.family_id) then raise exception 'Dompet utama sudah tersedia'; end if;
 return new;
end $$;
create trigger protect_primary before insert or update or delete on public.wallets for each row execute function public.protect_primary_wallet();
-- Serialisasi per keluarga menjaga saldo target setelah mutasi paralel.
create function public.lock_family_finance() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.families where id=public.my_family() for update;
 return null;
end $$;
create trigger lock_family before insert or update or delete on public.transactions for each statement execute function public.lock_family_finance();
create trigger lock_family before insert or update or delete on public.saving_goals for each statement execute function public.lock_family_finance();
create function public.sync_wallet_goals() returns trigger language plpgsql security definer set search_path='' as $$
declare f uuid; begin
 f:=coalesce(new.family_id,old.family_id);
 update public.saving_goals set current_amount=current_amount where family_id=f
 and wallet_id in (new.wallet_id,new.to_wallet_id,old.wallet_id,old.to_wallet_id);
 return coalesce(new,old);
end $$;
create trigger wallet_goal_total after insert or update or delete on public.transactions for each row execute function public.sync_wallet_goals();
revoke all on function public.protect_primary_wallet(),public.lock_family_finance(),public.sync_wallet_goals() from public,anon,authenticated;
update public.saving_goals set current_amount=current_amount;

-- Jika satu saldo lama berubah tidak sesuai, seluruh migrasi dibatalkan.
do $$ begin
 if exists(select 1 from duitkita_balance_before b where b.balance<>public.wallet_ledger(b.id,b.family_id)) then raise exception 'Saldo dompet lama tidak cocok setelah migrasi'; end if;
 if exists(select 1 from public.saving_goals g where g.current_amount<>coalesce((select sum(c.amount) from public.saving_contributions c where c.goal_id=g.id),0)) then raise exception 'Saldo target lama tidak cocok setelah migrasi'; end if;
end $$;
