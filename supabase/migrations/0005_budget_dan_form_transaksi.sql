-- Budget berulang per bulan, menggunakan kategori dan RLS keluarga yang sudah ada.
alter table public.categories add column monthly_budget numeric(15,2);
alter table public.categories add constraint category_monthly_budget_valid
  check (monthly_budget is null or (type='expense' and monthly_budget>0));

-- Normalisasi juga berlaku untuk mutasi REST langsung, bukan hanya formulir aplikasi.
create function public.normalize_transaction_fields() returns trigger
language plpgsql set search_path='' as $$
begin
  if new.type<>'expense' then
    new.receipt_url:=null;
    new.receipt_ocr_data:=null;
  end if;
  if new.type='transfer' then new.description:='Transfer antar dompet'; end if;
  return new;
end $$;
create trigger guard_00_transaction_fields before insert or update on public.transactions
for each row execute function public.normalize_transaction_fields();

-- lock_family dari 0003 menserialisasi penautan target dalam keluarga.
-- Duplikat arsip lama dipertahankan tanpa mengubah saldo atau menghapus riwayat.
-- Dompet tersebut tidak bisa ditautkan lagi pada target baru.
create function public.guard_goal_link() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' then
    if new.status='archived' then raise exception 'Fitur arsip target tidak tersedia'; end if;
  else
    if new.status='archived' and old.status<>'archived' then
      raise exception 'Fitur arsip target tidak tersedia';
    end if;
    if old.status='archived' and
      (to_jsonb(new)-'current_amount') is distinct from (to_jsonb(old)-'current_amount') then
      raise exception 'Fitur arsip target tidak tersedia';
    end if;
  end if;
  if tg_op='INSERT' or new.wallet_id is distinct from old.wallet_id then
    if exists(select 1 from public.saving_goals
      where family_id=new.family_id and wallet_id=new.wallet_id and id<>new.id) then
      raise exception 'Dompet sudah digunakan oleh target lain';
    end if;
  end if;
  return new;
end $$;
create trigger guard_goal_link before insert or update on public.saving_goals
for each row execute function public.guard_goal_link();
revoke all on function public.normalize_transaction_fields(),public.guard_goal_link() from public,anon,authenticated;
