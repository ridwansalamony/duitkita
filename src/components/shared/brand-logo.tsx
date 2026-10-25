import Link from "next/link";
import { cn } from "@/lib/utils";
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="DuitKita beranda"
      className={cn(
        "inline-flex items-center gap-2.5 font-heading text-2xl font-extrabold tracking-tight",
        light && "text-white",
      )}
    >
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-primary text-white">
        <svg
          width="25"
          height="25"
          viewBox="0 0 28 28"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 6v16h5a8 8 0 0 0 0-16H6Z"
            stroke="currentColor"
            strokeWidth="2.7"
          />
          <path
            d="m14 14 8-8m-8 8 8 8"
            stroke="currentColor"
            strokeWidth="2.7"
            strokeLinecap="round"
          />
        </svg>
      </span>
      DuitKita<span className="-ml-2 text-primary">.</span>
    </Link>
  );
}
