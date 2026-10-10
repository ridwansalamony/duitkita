-- Pengaman kedua untuk jalur PostgREST yang melewati limiter aplikasi.
create schema if not exists duitkita_private;
revoke all on schema duitkita_private from public,anon,authenticated;
create table duitkita_private.write_limits (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  requests integer not null,
  primary key(family_id,user_id)
);
revoke all on duitkita_private.write_limits from public,anon,authenticated;

create function public.admit_family_write() returns trigger
language plpgsql security definer set search_path='' as $$
declare f uuid; u uuid; total integer; window_time timestamptz:=date_trunc('minute',clock_timestamp());
begin
  -- Trigger turunan (sinkronisasi target, audit, seed) bukan request pengguna baru.
  if pg_trigger_depth()>1 then return coalesce(new,old); end if;
  u:=auth.uid();
  if u is null then return coalesce(new,old); end if;
  f:=public.my_family();
  if f is null then return coalesce(new,old); end if;
  insert into duitkita_private.write_limits(family_id,user_id,window_start,requests)
  values(f,u,window_time,1)
  on conflict(family_id,user_id) do update set
    requests=case when write_limits.window_start=excluded.window_start then write_limits.requests+1 else 1 end,
    window_start=excluded.window_start
  returning requests into total;
  if total>60 then raise exception 'Terlalu banyak perubahan. Tunggu satu menit lalu coba kembali.'; end if;
  return coalesce(new,old);
end $$;
revoke all on function public.admit_family_write() from public,anon,authenticated;
do $$ declare t text; begin
  foreach t in array array['transactions','wallets','categories','saving_goals','users','families'] loop
    execute format('create trigger admit_write before insert or update or delete on public.%I for each row execute function public.admit_family_write()',t);
  end loop;
end $$;
