import { TransactionDetail } from "@/features/transactions/detail";
export const metadata = { title: "Detail Transaksi" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TransactionDetail id={id} />;
}
