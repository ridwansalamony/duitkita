"use client";
import { isDemo } from "@/lib/mode";
import { LogoutMenuItem } from "./logout-menu-item";
import { UserAvatar } from "@/components/shared/user-avatar";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  Target,
  ChartNoAxesCombined,
  History,
  Settings,
  ChevronDown,
  Bell,
  Plus,
  Menu,
  ShieldCheck,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo, ThemeToggle } from "@/components/shared/common";
import { cn, familyInitials } from "@/lib/utils";
import { useDemo } from "@/lib/dummy/store";
import { useState } from "react";
import { toast } from "sonner";
const navigation = [
  { href: "/dashboard", label: "Dasbor", icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/dompet", label: "Dompet", icon: Wallet },
  { href: "/kategori", label: "Kategori", icon: Tags },
  { href: "/tabungan", label: "Target Tabungan", icon: Target },
  { href: "/laporan", label: "Laporan", icon: ChartNoAxesCombined },
  { href: "/riwayat-aktivitas", label: "Riwayat Aktivitas", icon: History },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];
function Navigation({ close }: { close?: () => void }) {
  const path = usePathname();
  const { user, data } = useDemo();
  return (
    <div className="flex h-full flex-col px-5 py-7">
      <div className="mb-9 px-3">
        <Logo />
      </div>
      <div className="mb-7 flex items-center gap-3 rounded-xl border bg-canvas p-3">
        <div
          aria-label={`Inisial ${data.familyName}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-semibold text-primary"
        >
          {familyInitials(data.familyName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {data.familyName.trim().replace(/^keluarga\b\s*/i, "")}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Ruang keuangan keluarga
          </p>
        </div>
        <ChevronDown size={14} className="text-muted-foreground" />
      </div>
      <p className="eyebrow mb-3 px-3 text-[10px]">Ruang kita</p>
      <nav className="space-y-1">
        {navigation
          .filter((n) => user.role === "owner" || n.href !== "/pengaturan")
          .map(({ href, label, icon: Icon }) => (
            <Link
              onClick={close}
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition-colors",
                path.startsWith(href)
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon size={19} strokeWidth={1.7} />
              {label}
              {path.startsWith(href) && (
                <span className="ml-auto size-1.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
      </nav>
      {user.role === "owner" && (
        <Link
          onClick={close}
          href="/pemilik/dashboard"
          className={cn(
            "mt-5 flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium text-muted-foreground hover:bg-muted",
            path.startsWith("/pemilik") && "bg-secondary text-primary",
          )}
        >
          <ShieldCheck size={19} />
          Ruang Pemilik
        </Link>
      )}
      <div className="mt-auto pt-8">
        <div className="rounded-2xl bg-secondary p-4">
          <p className="mb-1 font-heading text-sm font-bold text-secondary-foreground">
            Langkah kecil, mimpi besar.
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Sisihkan sedikit hari ini untuk cerita indah berdua nanti.
          </p>
          <Link
            onClick={close}
            href="/tabungan"
            className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary"
          >
            Lihat impian kita <ArrowUpRight size={14} />
          </Link>
        </div>
        <p className="mt-5 text-center text-[10px] text-muted-foreground">
          Dibuat untuk tumbuh bersama ♡
        </p>
      </div>
    </div>
  );
}
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, data, setUserId, reset } = useDemo();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const title =
    navigation.find((n) => path.startsWith(n.href))?.label ??
    (path.startsWith("/pemilik") ? "Ruang Pemilik" : "Profil Saya");
  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-card focus:p-4"
      >
        Lewati ke konten
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-62 border-r bg-card lg:block">
        <Navigation />
      </aside>
      <div className="lg:pl-62">
        <header className="sticky top-0 z-20 flex h-19 items-center justify-between gap-2 border-b bg-card/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="lg:hidden"
                  aria-label="Buka menu navigasi"
                >
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-70 p-0">
                <SheetTitle className="sr-only">Navigasi DuitKita</SheetTitle>
                <SheetDescription className="sr-only">
                  Menu ruang keuangan keluarga
                </SheetDescription>
                <Navigation close={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="hidden text-sm text-muted-foreground md:block">
              Ruang kita <span className="mx-3 text-border">/</span>
              <span className="font-medium text-foreground">{title}</span>
            </span>
            <span className="font-heading font-bold md:hidden">
              DuitKita<span className="text-primary">.</span>
            </span>
          </div>
          <div className="flex items-center gap-1 md:gap-3">
            <Button
              asChild
              size="sm"
              className="gradient-button mr-2 hidden rounded-xl sm:inline-flex"
            >
              <Link href="/transaksi/baru">
                <Plus size={15} />
                Catat Transaksi
              </Link>
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Lihat notifikasi"
                  className="relative"
                >
                  <Bell size={18} />
                  <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Kabar keluarga</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={isDemo ? "/tabungan/rumah-impian" : "/tabungan"}>
                    {isDemo
                      ? "Sari menabung Rp2.000.000 untuk rumah impian."
                      : `${data.goals.filter((g) => g.status === "achieved").length} target tabungan sudah tercapai.`}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/riwayat-aktivitas">
                    Lihat riwayat aktivitas keluarga
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="mx-1 hidden h-7 w-px bg-border sm:block" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto gap-2 px-1.5">
                  <UserAvatar
                    user={user}
                    className="size-9"
                    fallbackClassName="bg-[#eee5d9] text-sm font-bold text-[#7a5636]"
                  />
                  <span className="hidden text-left md:block">
                    <span className="block text-xs font-semibold">
                      {user.name.split(" ")[0]}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {user.role === "owner"
                        ? "Pemilik keluarga"
                        : "Anggota keluarga"}
                    </span>
                  </span>
                  <ChevronDown size={13} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {isDemo ? "Akun demo" : "Akun saya"}
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/profil">Profil saya</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isDemo &&
                  data.users
                    .filter((u) => u.familyId === user.familyId)
                    .map((u) => (
                      <DropdownMenuItem
                        key={u.id}
                        onClick={() => {
                          setUserId(u.id);
                          toast.info(`Melihat sebagai ${u.name}`);
                        }}
                      >
                        Lihat sebagai {u.name.split(" ")[0]}
                      </DropdownMenuItem>
                    ))}
                {isDemo && (
                  <DropdownMenuItem
                    onClick={() => {
                      reset();
                      toast.success("Data contoh dikembalikan ke awal");
                    }}
                  >
                    <RotateCcw />
                    Atur ulang demo
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <LogoutMenuItem />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main
          id="konten"
          className="mx-auto max-w-375 px-4 py-6 pb-28 md:p-8 lg:pb-10"
        >
          <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>{isDemo ? "Mode demo" : data.familyName}</span>
            <span className="text-border">/</span>
            <span>
              {isDemo
                ? "Data contoh September 2026 · perubahan tersimpan selama sesi"
                : "Catatan keluarga tersimpan dengan aman"}
            </span>
          </div>
          {children}
        </main>
        <nav
          aria-label="Navigasi bawah"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card px-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          {[navigation[0], navigation[1], navigation[2], navigation[4]].map(
            ({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[9px]",
                  path.startsWith(href)
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                <Icon size={20} />
                {label === "Target Tabungan" ? "Tabungan" : label}
              </Link>
            ),
          )}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-1 py-3 text-[9px] text-muted-foreground"
          >
            <Menu size={20} />
            Lainnya
          </button>
        </nav>
      </div>
    </div>
  );
}
