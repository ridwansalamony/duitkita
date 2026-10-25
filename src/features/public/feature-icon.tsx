import {
  Wallet,
  ShoppingBag,
  Home,
  Heart,
  Tag,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
const icons: Record<string, LucideIcon> = {
  wallet: Wallet,
  "shopping-bag": ShoppingBag,
  home: Home,
  heart: Heart,
  tag: Tag,
  briefcase: Briefcase,
};
export function FeatureIcon({ name = "wallet" }: { name?: string }) {
  const Icon = icons[name] ?? Wallet;
  return (
    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
      <Icon size={21} strokeWidth={1.8} />
    </span>
  );
}
