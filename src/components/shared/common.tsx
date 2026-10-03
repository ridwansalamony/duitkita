"use client";
import { isDemo } from "@/lib/mode";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Wallet,
  Heart,
  Home,
  Plane,
  GraduationCap,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Coffee,
  Briefcase,
  Gift,
  Tag,
  Moon,
  Sun,
  Plus,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, rupiah } from "@/lib/utils";
import type { Category, TxType } from "@/lib/dummy/data";

const icons: Record<string, LucideIcon> = {
  wallet: Wallet,
  heart: Heart,
  home: Home,
  plane: Plane,
  "graduation-cap": GraduationCap,
  utensils: Utensils,
  car: Car,
  "shopping-bag": ShoppingBag,
  zap: Zap,
  coffee: Coffee,
  briefcase: Briefcase,
  gift: Gift,
  tag: Tag,
};
export function FeatureIcon({
  name = "wallet",
  color,
  className,
}: {
  name?: string;
  color?: string;
  className?: string;
}) {
  const Icon = icons[name] ?? Wallet;
  return (
    <span
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary",
        className,
      )}
      style={color ? { backgroundColor: `${color}18`, color } : undefined}
    >
      <Icon size={21} strokeWidth={1.8} />
    </span>
  );
}
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
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Ganti tema terang atau gelap"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </Button>
  );
}
export function CurrencyDisplay({
  amount,
  type,
  className,
}: {
  amount: number;
  type?: TxType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "number whitespace-nowrap",
        type === "income" && "text-success",
        type === "expense" && "text-destructive",
        className,
      )}
    >
      {type === "income" ? "+" : type === "expense" ? "−" : ""}
      {rupiah(amount)}
    </span>
  );
}
export function CategoryBadge({ category }: { category?: Category }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: category?.color ?? "#64748b" }}
      />
      {category?.name ?? "Transfer"}
    </span>
  );
}
export function TxIcon({ type }: { type: TxType }) {
  const Icon =
    type === "income"
      ? ArrowDownLeft
      : type === "expense"
        ? ArrowUpRight
        : ArrowLeftRight;
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
        type === "income"
          ? "bg-success-surface text-success"
          : type === "expense"
            ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10"
            : "bg-secondary text-primary",
      )}
    >
      <Icon size={18} />
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      {" "}
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-2xl font-bold md:text-[30px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
export function AddLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Button asChild className="gradient-button rounded-xl">
      <Link href={href}>
        <Plus size={16} />
        {children}
      </Link>
    </Button>
  );
}
export function EmptyState({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
      <FeatureIcon name="wallet" />
      <h2 className="font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {href && (
        <Button asChild variant="outline">
          <Link href={href}>
            {cta ?? "Kembali"}
            <ArrowRight size={16} />
          </Link>
        </Button>
      )}
    </div>
  );
}
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.35 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
export function DemoNote() {
  if (!isDemo) return null;
  return (
    <p className="rounded-xl border border-primary/10 bg-secondary/60 px-4 py-3 text-xs leading-relaxed text-secondary-foreground">
      Anda sedang mencoba data contoh Budi & Sari. Perubahan berlaku selama sesi
      ini dan kembali ke awal saat halaman dimuat ulang.
    </p>
  );
}
