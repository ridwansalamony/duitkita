import { rupiah } from "@/lib/utils";

export function BudgetProgress({
  limit,
  spent,
  title = "Budget bulan ini",
}: {
  limit: number;
  spent: number;
  title?: string;
}) {
  const percent = (spent / limit) * 100;
  const remaining = Math.round((limit - spent) * 100) / 100;
  const status =
    percent >= 100
      ? "text-destructive"
      : percent >= 80
        ? "text-amber-600 dark:text-amber-400"
        : "text-primary";
  return (
    <div className="space-y-2 text-xs" data-testid="budget-progress">
      <div className="flex flex-wrap justify-between gap-1">
        <span>{title}</span>
        <strong className={status}>{Math.round(percent)}% terpakai</strong>
      </div>
      <div
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.round(percent))}
        aria-valuetext={`${rupiah(spent)} dari ${rupiah(limit)}`}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={`h-full rounded-full ${percent >= 100 ? "bg-destructive" : percent >= 80 ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <p className="text-muted-foreground">
        {rupiah(spent)} dari {rupiah(limit)}
      </p>
      <p className={status}>
        {remaining < 0
          ? `Melebihi budget ${rupiah(-remaining)}`
          : remaining === 0
            ? "Budget sudah habis"
            : `Sisa budget ${rupiah(remaining)}`}
        {percent >= 80 && percent < 100 ? " · Mendekati batas" : ""}
      </p>
    </div>
  );
}
