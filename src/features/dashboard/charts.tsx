"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Recharts measures its container and initializes a client store. Mount it after
// hydration so server dimensions cannot leave the SVG surface uninitialized.
export const TrendChart = dynamic(
  () => import("./charts-client").then((module) => module.TrendChart),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[230px] w-full" aria-label="Memuat grafik tren" />
    ),
  },
);
export const CompositionChart = dynamic(
  () => import("./charts-client").then((module) => module.CompositionChart),
  {
    ssr: false,
    loading: () => (
      <Skeleton
        className="mx-auto h-[190px] w-full max-w-[240px]"
        aria-label="Memuat komposisi pengeluaran"
      />
    ),
  },
);
