import "server-only";
import { sql } from "drizzle-orm";
import { withIdentity } from "@/db";
import {
  aggregateReport,
  reportFilter,
  type ReportTransaction,
} from "@/lib/reports";

export async function getFinancialReport(input: unknown) {
  const { start, end } = reportFilter.parse(input);
  return withIdentity(async (tx, { familyId }) => {
    const [family] = await tx.execute(
      sql`select name from public.families where id=${familyId}::uuid`,
    );
    const rows = await tx.execute(sql`
      select t.id,t.transaction_date as date,t.type,t.amount,t.description,
        coalesce(t.category_id::text,'') as "categoryId",
        case when t.type='transfer' then 'Transfer' else coalesce(c.name,'Lainnya') end as category,
        t.user_id as "userId",coalesce(u.name,'Anggota sebelumnya') as member,
        t.wallet_id as "walletId",w.name as wallet,coalesce(dest.name,'') as destination
      from public.transactions t
      join public.wallets w on w.id=t.wallet_id and w.family_id=${familyId}::uuid
      left join public.wallets dest on dest.id=t.to_wallet_id and dest.family_id=${familyId}::uuid
      left join public.categories c on c.id=t.category_id and c.family_id=${familyId}::uuid
      left join public.users u on u.id=t.user_id and u.family_id=${familyId}::uuid
      where t.family_id=${familyId}::uuid and t.transaction_date between ${start}::date and ${end}::date
      order by t.transaction_date desc,t.created_at desc,t.id desc
      limit 10001`);
    if (rows.length > 10000)
      throw new Error(
        "Laporan terlalu besar. Pilih rentang tanggal yang lebih pendek (maksimal 10.000 transaksi).",
      );
    return aggregateReport(
      String(family.name),
      start,
      end,
      rows.map((r) => ({
        ...r,
        amount: Number(r.amount),
      })) as ReportTransaction[],
    );
  });
}
