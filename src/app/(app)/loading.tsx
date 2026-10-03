import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="space-y-6" aria-label="Memuat ruang keluarga">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-40 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
