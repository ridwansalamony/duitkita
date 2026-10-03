import type { Category, Transaction } from "@/lib/dummy/data";

export function categoryBudget(
  category: Category,
  transactions: Transaction[],
  familyId: string,
  month: string,
  excludeId?: string,
) {
  if (
    category.familyId !== familyId ||
    category.type !== "expense" ||
    !category.monthlyBudget
  )
    return null;
  const spentCents = transactions.reduce(
    (sum, transaction) =>
      transaction.familyId === familyId &&
      transaction.type === "expense" &&
      transaction.categoryId === category.id &&
      transaction.date.slice(0, 7) === month &&
      transaction.id !== excludeId
        ? sum + Math.round(transaction.amount * 100)
        : sum,
    0,
  );
  const limit = category.monthlyBudget;
  const spent = spentCents / 100;
  return {
    limit,
    spent,
    remaining: (Math.round(limit * 100) - spentCents) / 100,
    percent: (spent / limit) * 100,
  };
}
