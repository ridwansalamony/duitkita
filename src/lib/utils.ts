import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function familyInitials(name: string) {
  const label = name.trim().replace(/^keluarga\b\s*/i, "");
  const partners = label.split(/\s*&\s*|\s+dan\s+/i).filter(Boolean);
  const words = partners.length > 1 ? partners : label.split(/\s+/);
  return (
    words
      .map((word) => word.match(/[\p{L}\p{N}]/u)?.[0] ?? "")
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toLocaleUpperCase("id-ID") || "K"
  );
}
export function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
export function tanggal(value: string, full = false) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: full ? "long" : "short",
    year: full ? "numeric" : undefined,
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
