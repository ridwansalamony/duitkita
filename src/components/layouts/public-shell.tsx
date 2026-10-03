"use client";
import { isDemo } from "@/lib/mode";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, ArrowUpRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
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
              <SheetContent>
                <SheetTitle>Jelajahi DuitKita</SheetTitle>
                <SheetDescription>
                  Keuangan keluarga, lebih dekat.
                </SheetDescription>
                <nav className="grid gap-2 p-5">
                  {[
                    ["/fitur", "Fitur"],
                    ["/tentang", "Tentang Kami"],
                    ["/kontak", "Kontak"],
                    ["/masuk", "Masuk"],
                    ["/daftar", "Mulai Bersama"],
                  ].map(([href, label]) => (
                    <Link
                      key={href}
                      onClick={() => setOpen(false)}
                      className="rounded-xl p-3 hover:bg-secondary"
                      href={href}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
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
