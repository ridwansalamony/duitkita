import { PublicShell } from "@/components/layouts/public-shell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
