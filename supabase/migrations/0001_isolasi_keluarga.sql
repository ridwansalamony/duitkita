-- Identitas selalu berasal dari Supabase Auth, bukan metadata yang bisa diedit pengguna.
alter table public.users add constraint users_auth_fk foreign key (id) references auth.users(id) on delete cascade;
alter table public.transactions add constraint positive_amount check (amount > 0);
alter table public.transactions add constraint valid_transfer check ((type = 'transfer' and to_wallet_id is not null and to_wallet_id <> wallet_id and category_id is null) or (type <> 'transfer' and to_wallet_id is null));
alter table public.wallets add constraint wallet_owner check ((type = 'shared' and owner_user_id is null) or (type = 'personal' and owner_user_id is not null));
alter table public.saving_goals add constraint positive_target check (target_amount > 0);
alter table public.saving_contributions add constraint positive_contribution check (amount > 0);
create index contributions_goal_idx on public.saving_contributions(goal_id);
create index wallets_family_idx on public.wallets(family_id);
create index categories_family_idx on public.categories(family_id);
create index goals_family_idx on public.saving_goals(family_id);
create unique index category_family_name_type_idx on public.categories(family_id,lower(name),type);

create function public.my_family() returns uuid language sql stable security definer set search_path = '' as $$
  select family_id from public.users where id = auth.uid()
$$;
create function public.in_family(f uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(f = public.my_family() and f::text = (auth.jwt()->>'family_id'), false)
$$;
create function public.is_owner(f uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.users where id=auth.uid() and family_id=f and role='owner')
$$;
create function public.can_wallet(w uuid, f uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select f=public.my_family() and exists(select 1 from public.wallets where id=w and family_id=f and (type='shared' or owner_user_id=auth.uid()))
$$;

alter table public.families enable row level security;
alter table public.users enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.saving_goals enable row level security;
alter table public.saving_contributions enable row level security;
alter table public.audit_logs enable row level security;
revoke all on public.families, public.users, public.wallets, public.categories, public.transactions, public.saving_goals, public.saving_contributions, public.audit_logs from anon, authenticated;
grant select on public.families, public.users, public.audit_logs to authenticated;
grant update(name, avatar_url) on public.users to authenticated;
grant update(name, invite_code, invite_expires_at) on public.families to authenticated;
grant select, insert, update, delete on public.wallets, public.categories, public.transactions, public.saving_goals to authenticated;
revoke delete on public.saving_goals from authenticated;
grant select, insert on public.saving_contributions to authenticated;
create policy family_read on public.families for select to authenticated using (public.in_family(id));
create policy family_edit on public.families for update to authenticated using(public.in_family(id) and public.is_owner(id)) with check(public.in_family(id) and public.is_owner(id));
create policy user_read on public.users for select to authenticated using(id=auth.uid() or public.in_family(family_id));
create policy user_edit on public.users for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy wallet_read on public.wallets for select to authenticated using(public.in_family(family_id) and (type='shared' or owner_user_id=auth.uid()));
create policy wallet_add on public.wallets for insert to authenticated with check(public.in_family(family_id) and ((type='personal' and owner_user_id=auth.uid()) or (type='shared' and public.is_owner(family_id))));
create policy wallet_edit on public.wallets for update to authenticated using(public.in_family(family_id) and (owner_user_id=auth.uid() or (type='shared' and public.is_owner(family_id)))) with check(public.in_family(family_id) and (owner_user_id=auth.uid() or (type='shared' and public.is_owner(family_id))));
create policy wallet_remove on public.wallets for delete to authenticated using(public.in_family(family_id) and (owner_user_id=auth.uid() or (type='shared' and public.is_owner(family_id))));
create policy category_access on public.categories for all to authenticated using(public.in_family(family_id)) with check(public.in_family(family_id));
create policy tx_read on public.transactions for select to authenticated using(public.in_family(family_id) and public.can_wallet(wallet_id,family_id) and (to_wallet_id is null or public.can_wallet(to_wallet_id,family_id)));
create policy tx_add on public.transactions for insert to authenticated with check(public.in_family(family_id) and user_id=auth.uid() and public.can_wallet(wallet_id,family_id) and (to_wallet_id is null or public.can_wallet(to_wallet_id,family_id)));
create policy tx_edit on public.transactions for update to authenticated using(public.in_family(family_id) and public.can_wallet(wallet_id,family_id) and (to_wallet_id is null or public.can_wallet(to_wallet_id,family_id))) with check(public.in_family(family_id) and public.can_wallet(wallet_id,family_id) and (to_wallet_id is null or public.can_wallet(to_wallet_id,family_id)));
create policy tx_remove on public.transactions for delete to authenticated using(public.in_family(family_id) and public.can_wallet(wallet_id,family_id) and (to_wallet_id is null or public.can_wallet(to_wallet_id,family_id)));
create policy goal_access on public.saving_goals for all to authenticated using(public.in_family(family_id)) with check(public.in_family(family_id));
create policy contribution_read on public.saving_contributions for select to authenticated using(exists(select 1 from public.saving_goals g where g.id=goal_id and public.in_family(g.family_id)) and (wallet_id is null or public.can_wallet(wallet_id,public.my_family())));
create policy contribution_add on public.saving_contributions for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.saving_goals g where g.id=goal_id and public.in_family(g.family_id)) and public.can_wallet(wallet_id,public.my_family()));

create function public.new_auth_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.users(id,email,name) values(new.id,new.email,left(coalesce(nullif(new.raw_user_meta_data->>'name',''),split_part(new.email,'@',1)),120));
 return new;
end $$;
create trigger create_profile after insert on auth.users for each row execute function public.new_auth_user();
create function public.custom_access_token_hook(event jsonb) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare f uuid;
begin
 select family_id into f from public.users where id=(event->>'user_id')::uuid;
 return jsonb_set(event,'{claims,family_id}',coalesce(to_jsonb(f),'null'::jsonb));
end $$;
revoke all on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;

-- Pembuatan keluarga dan seed berada dalam satu transaksi. Kunci profil mencegah dua keluarga per akun.
create function public.create_family(family_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare f uuid; existing uuid;
begin
 if auth.uid() is null or length(trim(family_name)) not between 2 and 120 then raise exception 'Nama keluarga tidak valid'; end if;
 select family_id into existing from public.users where id=auth.uid() for update;
 if not found or existing is not null then raise exception 'Akun sudah memiliki keluarga'; end if;
 insert into public.families(name,invite_code,invite_expires_at) values(trim(family_name),upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),now()+interval '7 days') returning id into f;
 update public.users set family_id=f,role='owner' where id=auth.uid();
 insert into public.wallets(family_id,name,type) values(f,'Dompet Rumah Tangga','shared');
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
create function public.join_family(invitation text) returns uuid language plpgsql security definer set search_path='' as $$
declare f uuid; existing uuid;
begin
 if auth.uid() is null then raise exception 'Silakan masuk terlebih dahulu'; end if;
 select family_id into existing from public.users where id=auth.uid() for update;
 if not found or existing is not null then raise exception 'Akun sudah memiliki keluarga'; end if;
 select id into f from public.families where invite_code=upper(trim(invitation)) and invite_expires_at>now() for update;
 if f is null then raise exception 'Kode undangan tidak valid atau sudah kedaluwarsa'; end if;
 if (select count(*) from public.users where family_id=f)>=2 then raise exception 'Keluarga sudah memiliki dua anggota'; end if;
 update public.users set family_id=f,role='member' where id=auth.uid();
 return f;
end $$;
create function public.remove_member(member_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare f uuid := public.my_family();
begin
 if not public.in_family(f) or not public.is_owner(f) or member_id=auth.uid() then raise exception 'Tidak diizinkan'; end if;
 perform 1 from public.families where id=f for update;
 update public.users set family_id=null,role='member' where id=member_id and family_id=f and role='member';
 if not found then raise exception 'Anggota tidak ditemukan'; end if;
 update public.families set invite_code=upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),invite_expires_at=now()+interval '7 days' where id=f;
end $$;

-- Agregat boleh mencakup dompet pribadi pasangan, tanpa mengembalikan detailnya.
create function public.wallet_balance(w uuid, f uuid) returns numeric language sql stable security definer set search_path='' as $$
 select coalesce(sum(v),0) from (
 select case when wallet_id=w then case when type='income' then amount else -amount end else 0 end + case when to_wallet_id=w then amount else 0 end as v from public.transactions where family_id=f and (wallet_id=w or to_wallet_id=w)
 union all select -c.amount from public.saving_contributions c join public.saving_goals g on g.id=c.goal_id where g.family_id=f and c.wallet_id=w
 ) ledger where public.in_family(f) and public.can_wallet(w,f)
$$;
create function public.family_balance(f uuid) returns numeric language sql stable security definer set search_path='' as $$
 select case when public.in_family(f) then
 coalesce((select sum(case when type='income' then amount when type='expense' then -amount else 0 end) from public.transactions where family_id=f),0)
 - coalesce((select sum(c.amount) from public.saving_contributions c join public.saving_goals g on g.id=c.goal_id where g.family_id=f),0) else null end
$$;
create function public.goal_contributions(f uuid) returns table(id uuid,goal_id uuid,user_id uuid,wallet_id uuid,amount numeric,note text,contributed_at timestamptz) language sql stable security definer set search_path='' as $$
 select c.id,c.goal_id,c.user_id,case when public.can_wallet(c.wallet_id,f) then c.wallet_id else null end,c.amount,
 case when public.can_wallet(c.wallet_id,f) then c.note else 'Kontribusi dari dompet pribadi' end,c.contributed_at
 from public.saving_contributions c join public.saving_goals g on g.id=c.goal_id where g.family_id=f and public.in_family(f)
$$;

-- Referensi lintas keluarga, perubahan kepemilikan, dan nominal goal tidak dipercaya dari browser.
create function public.guard_finance() returns trigger language plpgsql security definer set search_path='' as $$
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
   select coalesce(sum(amount),0) into new.current_amount from public.saving_contributions where goal_id=new.id;
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
create trigger guard_wallet before insert or update on public.wallets for each row execute function public.guard_finance();
create trigger guard_tx before insert or update on public.transactions for each row execute function public.guard_finance();
create trigger guard_goal before insert or update on public.saving_goals for each row execute function public.guard_finance();
create trigger guard_contribution before insert on public.saving_contributions for each row execute function public.guard_finance();
create trigger guard_category before update on public.categories for each row execute function public.guard_finance();
create function public.sync_goal() returns trigger language plpgsql security definer set search_path='' as $$
begin update public.saving_goals set current_amount=current_amount where id=new.goal_id; return new; end $$;
create trigger contribution_total after insert on public.saving_contributions for each row execute function public.sync_goal();
create function public.category_fallback() returns trigger language plpgsql security definer set search_path='' as $$
declare fallback uuid;
begin
 if old.is_default and old.name='Lainnya' then raise exception 'Kategori Lainnya tetap diperlukan'; end if;
 select id into fallback from public.categories where family_id=old.family_id and type=old.type and name='Lainnya' and is_default limit 1;
 if fallback is null then raise exception 'Kategori Lainnya belum tersedia'; end if;
 update public.transactions set category_id=fallback where family_id=old.family_id and category_id=old.id;
 return old;
end $$;
create trigger category_remove before delete on public.categories for each row execute function public.category_fallback();

-- Simpan penanda privasi pada snapshot agar log dompet yang dihapus tetap terlindungi.
create function public.capture_audit() returns trigger language plpgsql security definer set search_path='' as $$
declare b jsonb; a jsonb; r jsonb; f uuid; private_id uuid; other_private uuid;
begin
 if tg_op<>'INSERT' then b:=to_jsonb(old); end if;
 if tg_op<>'DELETE' then a:=to_jsonb(new); end if;
 r:=coalesce(a,b); f:=(r->>'family_id')::uuid;
 if tg_table_name='families' then f:=(r->>'id')::uuid; end if;
 if tg_table_name='users' then f:=coalesce((a->>'family_id')::uuid,(b->>'family_id')::uuid); end if;
 if tg_table_name='saving_contributions' then select family_id into f from public.saving_goals where id=(r->>'goal_id')::uuid; end if;
 if f is null then return coalesce(new,old); end if;
 if tg_table_name='wallets' then private_id:=(r->>'owner_user_id')::uuid;
 elsif tg_table_name in ('transactions','saving_contributions') then
 select owner_user_id into private_id from public.wallets where family_id=f and id in ((r->>'wallet_id')::uuid,(r->>'to_wallet_id')::uuid) and type='personal' limit 1;
 if b is not null then select owner_user_id into other_private from public.wallets where family_id=f and id in ((b->>'wallet_id')::uuid,(b->>'to_wallet_id')::uuid) and type='personal' limit 1; end if;
 private_id:=coalesce(private_id,other_private);
 end if;
 b:=case when b is null then null else b || jsonb_build_object('_private_owner',private_id) end;
 a:=case when a is null then null else a || jsonb_build_object('_private_owner',private_id) end;
 insert into public.audit_logs(family_id,user_id,action,entity_type,entity_id,before_data,after_data,ip_address,user_agent)
 values(f,auth.uid(),case tg_op when 'INSERT' then 'create'::public.audit_action when 'UPDATE' then 'update'::public.audit_action else 'delete'::public.audit_action end,tg_table_name,(r->>'id')::uuid,b,a,left(nullif(current_setting('app.ip',true),''),45),left(nullif(current_setting('app.agent',true),''),1000));
 return coalesce(new,old);
end $$;
create policy audit_read on public.audit_logs for select to authenticated using(public.in_family(family_id) and (coalesce(after_data,before_data)->>'_private_owner' is null or coalesce(after_data,before_data)->>'_private_owner'=auth.uid()::text));
do $$ declare t text; begin foreach t in array array['families','users','wallets','categories','transactions','saving_goals','saving_contributions'] loop execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function public.capture_audit()',t); end loop; end $$;

revoke execute on function public.my_family(),public.in_family(uuid),public.is_owner(uuid),public.can_wallet(uuid,uuid),public.new_auth_user(),public.create_family(text),public.join_family(text),public.remove_member(uuid),public.wallet_balance(uuid,uuid),public.family_balance(uuid),public.goal_contributions(uuid),public.guard_finance(),public.sync_goal(),public.category_fallback(),public.capture_audit() from public,anon;
grant execute on function public.my_family(),public.in_family(uuid),public.is_owner(uuid),public.can_wallet(uuid,uuid),public.create_family(text),public.join_family(text),public.remove_member(uuid),public.wallet_balance(uuid,uuid),public.family_balance(uuid),public.goal_contributions(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('receipts','receipts',false,5242880,array['image/jpeg','image/png']) on conflict(id) do nothing;
create policy receipt_upload on storage.objects for insert to authenticated with check(bucket_id='receipts' and (storage.foldername(name))[1]=public.my_family()::text and public.in_family(public.my_family()) and (storage.foldername(name))[2]=auth.uid()::text);
create policy receipt_read on storage.objects for select to authenticated using(bucket_id='receipts' and (storage.foldername(name))[1]=public.my_family()::text and public.in_family(public.my_family()) and ((storage.foldername(name))[2]=auth.uid()::text or exists(select 1 from public.transactions t where t.family_id=public.my_family() and t.receipt_url=name)));
-- Realtime INSERT/UPDATE dilindungi RLS; DELETE ditangani juga oleh penyegaran saat tab aktif.
do $$ begin if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='transactions') then alter publication supabase_realtime add table public.transactions; end if; end $$;
