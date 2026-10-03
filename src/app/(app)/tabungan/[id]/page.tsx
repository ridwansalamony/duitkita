import { GoalDetail } from "@/features/goals/goals";
export const metadata = { title: "Detail Target Tabungan" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GoalDetail id={id} />;
}
