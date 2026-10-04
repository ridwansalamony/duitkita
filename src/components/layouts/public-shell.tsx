"use client";
import { isDemo } from "@/lib/mode";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  ArrowUpRight,
  Heart,
  Sparkles,
  Users,
  MessageCircle,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Logo, ThemeToggle } from "@/components/shared/common";
import { cn } from "@/lib/utils";
export function PublicShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
          <Logo />
          <nav className="hidden gap-8 md:flex">
            {[
              ["/fitur", "Fitur"],
              ["/tentang", "Tentang Kami"],
              ["/kontak", "Kontak"],
            ].map(([href, label]) => (
              <Link
                key={href}
                className={cn(
                  "text-sm text-muted-foreground transition-colors hover:text-primary",
                  path === href && "font-semibold text-primary",
                )}
                href={href}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/masuk">Masuk</Link>
            </Button>
            <Button
              asChild
              className="gradient-button hidden rounded-xl sm:inline-flex"
            >
              <Link href="/daftar">
                Mulai Bersama <ArrowUpRight size={16} />
              </Link>
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Buka menu"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent
                showCloseButton={false}
                className="w-[calc(100%-1.5rem)] max-w-sm gap-0 rounded-l-3xl bg-card"
              >
                <div className="border-b bg-secondary/40 px-6 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
                  <div className="mb-7 flex items-center justify-between gap-3">
                    <SheetClose asChild>
                      <span>
                        <Logo />
                      </span>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Tutup menu"
                        className="size-10 rounded-full"
                      >
                        <X size={18} />
                      </Button>
                    </SheetClose>
                  </div>
                  <SheetTitle className="font-heading text-xl tracking-tight">
                    Jelajahi DuitKita
                  </SheetTitle>
                  <SheetDescription className="mt-2 leading-6">
                    Ruang untuk keuangan dan impian keluarga.
                  </SheetDescription>
                </div>
                <nav
                  aria-label="Navigasi utama mobile"
                  className="grid gap-2 p-4"
                >
                  {[
                    {
                      href: "/fitur",
                      label: "Fitur",
                      detail: "Kenali semua kemudahannya",
                      Icon: Sparkles,
                    },
                    {
                      href: "/tentang",
                      label: "Tentang Kami",
                      detail: "Cerita di balik DuitKita",
                      Icon: Users,
                    },
                    {
                      href: "/kontak",
                      label: "Kontak",
                      detail: "Kami siap mendengarkan",
                      Icon: MessageCircle,
                    },
                  ].map(({ href, label, detail, Icon }) => (
                    <Link
                      key={href}
                      onClick={() => setOpen(false)}
                      aria-current={path === href ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        path === href && "bg-secondary text-primary",
                      )}
                      href={href}
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-secondary text-primary">
                        <Icon size={20} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold">
                          {label}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          {detail}
                        </span>
                      </span>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-muted-foreground"
                      />
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto border-t px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                  <p className="mb-4 text-sm font-medium">
                    Mulai cerita keuangan Anda berdua.
                  </p>
                  <Button
                    asChild
                    className="gradient-button h-12 w-full rounded-xl"
                  >
                    <Link href="/daftar" onClick={() => setOpen(false)}>
                      Mulai Bersama <ArrowUpRight size={17} />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-3 h-12 w-full rounded-xl"
                  >
                    <Link href="/masuk" onClick={() => setOpen(false)}>
                      Masuk ke akun
                    </Link>
                  </Button>
                  <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Heart size={13} className="text-primary" />
                    Uang berdua, tercatat berdua.
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 md:px-8">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
              Uang berdua, tercatat berdua.
              <br />
              Ruang kecil untuk rencana besar keluarga Anda.
            </p>
          </div>
          <div className="flex flex-wrap gap-12 text-sm md:justify-end">
            <div className="grid gap-3">
              <span className="font-semibold">Kenali DuitKita</span>
              <Link href="/fitur" className="text-muted-foreground">
                Fitur lengkap
              </Link>
              <Link href="/tentang" className="text-muted-foreground">
                Cerita kami
              </Link>
              <Link href="/kontak" className="text-muted-foreground">
                Hubungi kami
              </Link>
            </div>
            <div className="grid gap-3">
              <span className="font-semibold">Mulai bersama</span>
              <Link href="/daftar" className="text-muted-foreground">
                Buat akun
              </Link>
              <Link href="/dashboard" className="text-muted-foreground">
                {isDemo ? "Jelajahi demo" : "Buka Dasbor"}
              </Link>
              <Link href="/tentang#privasi" className="text-muted-foreground">
                {isDemo ? "Privasi & ketentuan demo" : "Tentang data Anda"}
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t px-5 py-5 text-xs text-muted-foreground md:px-8">
          <span>© 2026 DuitKita. Setiap rupiah punya cerita.</span>
          <span className="flex items-center gap-1.5">
            Dirancang dengan <Heart size={12} className="text-primary" /> untuk
            keluarga Indonesia
          </span>
        </div>
      </footer>
    </>
  );
}
