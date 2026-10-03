import { TransactionEditor } from "@/features/transactions/editor";
export const metadata = { title: "Catat Transaksi" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tujuan?: string }>;
}) {
  const { tujuan } = await searchParams;
  return <TransactionEditor transferTo={tujuan} />;
}
