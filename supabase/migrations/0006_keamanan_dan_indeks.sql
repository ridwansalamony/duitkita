-- Snapshot terbaru dan laporan: filter keluarga serta urutan memakai satu indeks.
create index tx_family_order_idx on public.transactions(family_id,transaction_date desc,created_at desc,id desc);
create index tx_family_destination_idx on public.transactions(family_id,to_wallet_id) where to_wallet_id is not null;
create index tx_category_idx on public.transactions(category_id) where category_id is not null;
create index tx_user_idx on public.transactions(user_id);
create index tx_receipt_idx on public.transactions(family_id,receipt_url) where receipt_url is not null;
create index goals_wallet_idx on public.saving_goals(wallet_id);
create index goals_creator_idx on public.saving_goals(created_by_user_id);
create index audit_user_idx on public.audit_logs(user_id) where user_id is not null;

-- Batasi payload juga pada jalur PostgREST, bukan hanya Server Actions.
-- NOT VALID mempertahankan baris lama; semua INSERT/UPDATE baru tetap diperiksa.
alter table public.users add constraint profile_payload_size check (
  length(name) between 1 and 120 and (avatar_url is null or length(avatar_url)<=400000)
) not valid;
alter table public.transactions add constraint transaction_payload_size check (
  (description is null or length(description)<=2000)
  and (receipt_url is null or length(receipt_url)<=300)
  and (receipt_ocr_data is null or octet_length(receipt_ocr_data::text)<=4096)
) not valid;

-- Foto profil tidak perlu disalin setiap kali profil diperbarui atau dikirim lewat Realtime.
create function public.compact_audit_payload() returns trigger
language plpgsql set search_path='' as $$
begin
  new.before_data:=new.before_data-array['avatar_url','receipt_ocr_data','invite_code','invite_expires_at'];
  new.after_data:=new.after_data-array['avatar_url','receipt_ocr_data','invite_code','invite_expires_at'];
  return new;
end $$;
revoke all on function public.compact_audit_payload() from public,anon,authenticated;
create trigger compact_audit before insert on public.audit_logs
for each row execute function public.compact_audit_payload();
