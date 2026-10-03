-- Setiap mutasi menghasilkan audit INSERT, termasuk penghapusan. Subscription
-- tetap berfilter family_id dan tunduk pada RLS audit (termasuk dompet pribadi).
do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
    and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='audit_logs') then
    alter publication supabase_realtime add table public.audit_logs;
  end if;
end $$;
