-- Saldo tidak boleh menjadi negatif atau memperburuk saldo minus lama.
-- lock_family (BEFORE STATEMENT, migrasi 0003) mengunci keluarga sebelum pemeriksaan.
create function public.guard_wallet_funds() returns trigger
language plpgsql security definer set search_path='' as $$
declare
 f uuid; w uuid; before_effect numeric; after_effect numeric; delta numeric;
 prior jsonb := case when tg_op='INSERT' then '{}'::jsonb else to_jsonb(old) end;
 proposed jsonb := case when tg_op='DELETE' then '{}'::jsonb else to_jsonb(new) end;
begin
 f:=coalesce((proposed->>'family_id')::uuid,(prior->>'family_id')::uuid);
 for w in select distinct x from unnest(array[
  (prior->>'wallet_id')::uuid,(prior->>'to_wallet_id')::uuid,
  (proposed->>'wallet_id')::uuid,(proposed->>'to_wallet_id')::uuid
 ]) x where x is not null loop
  -- Pemeriksaan referensi dan RLS tetap berlaku; jangan membaca saldo tenant lain.
  if not exists(select 1 from public.wallets where id=w and family_id=f) then
   raise exception 'Dompet berbeda keluarga';
  end if;
  before_effect :=
   case when (prior->>'wallet_id')::uuid=w then
    case when prior->>'type'='income' then (prior->>'amount')::numeric else -(prior->>'amount')::numeric end else 0 end
   +case when prior->>'type'='transfer' and (prior->>'to_wallet_id')::uuid=w then (prior->>'amount')::numeric else 0 end;
  after_effect :=
   case when (proposed->>'wallet_id')::uuid=w then
    case when proposed->>'type'='income' then (proposed->>'amount')::numeric else -(proposed->>'amount')::numeric end else 0 end
   +case when proposed->>'type'='transfer' and (proposed->>'to_wallet_id')::uuid=w then (proposed->>'amount')::numeric else 0 end;
  delta:=after_effect-before_effect;
  if delta<0 and public.wallet_ledger(w,f)+delta<0 then
   raise exception 'Saldo dompet belum mencukupi';
  end if;
 end loop;
 return coalesce(new,old);
end $$;
revoke all on function public.guard_wallet_funds() from public,anon,authenticated;
create trigger guard_balance before insert or update or delete on public.transactions
for each row execute function public.guard_wallet_funds();
