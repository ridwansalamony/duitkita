"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallPrompt = Event & {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [ios, setIos] = useState(false);
  const [android, setAndroid] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/pekerja-aplikasi.js", { updateViaCache: "none" })
        .catch(() => {
          // Installation remains available when offline support cannot be registered.
        });
    }
    const standalone = window.matchMedia("(display-mode: standalone)");
    const installed = () =>
      standalone.matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem("duitkita-instal-ditutup") === "1";
    } catch {}
    if (installed()) return;
    setHidden(dismissed);
    setAndroid(/Android/i.test(navigator.userAgent));
    setIos(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );
    const onPrompt = (event: Event) => {
      if (installed()) return;
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstalled = () => {
      setHidden(true);
      setPrompt(null);
    };
    const onDisplayChange = () => {
      if (installed()) onInstalled();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    standalone.addEventListener("change", onDisplayChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      standalone.removeEventListener("change", onDisplayChange);
    };
  }, []);

  if (hidden || (!prompt && !ios && !android && !error)) return null;
  return (
    <aside
      aria-label="Instal aplikasi DuitKita"
      className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 rounded-2xl border bg-card p-4 text-card-foreground shadow-lg md:hidden"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ikon/aplikasi-192.png"
          width="40"
          height="40"
          alt=""
          className="rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">DuitKita di layar utama</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Buka ruang keuangan keluarga lebih mudah.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Tutup ajakan instal"
          onClick={() => {
            setHidden(true);
            try {
              sessionStorage.setItem("duitkita-instal-ditutup", "1");
            } catch {}
          }}
        >
          <X />
        </Button>
      </div>
      {prompt ? (
        <Button
          type="button"
          className="mt-3 w-full"
          loadingText="Membuka instalasi…"
          onClick={async () => {
            setError("");
            try {
              const result = await prompt.prompt();
              if (result.outcome === "accepted") setHidden(true);
            } catch {
              setError(
                "Instalasi belum tersedia. Coba melalui menu browser: Instal aplikasi atau Tambahkan ke layar utama.",
              );
            } finally {
              setPrompt(null);
            }
          }}
        >
          <Download />
          Instal DuitKita
        </Button>
      ) : ios ? (
        <p className="mt-3 text-sm">
          Di Safari, buka menu <strong>Bagikan</strong>, pilih{" "}
          <strong>Tambahkan ke Layar Utama</strong>, lalu aktifkan{" "}
          <strong>Buka sebagai App Web</strong> jika tersedia.
        </p>
      ) : android ? (
        <p className="mt-3 text-sm">
          Buka DuitKita di Chrome, lalu buka menu <strong>⋮</strong> dan pilih{" "}
          <strong>Instal aplikasi</strong> atau{" "}
          <strong>Tambahkan ke layar utama</strong> jika tersedia.
        </p>
      ) : null}
      {error && (
        <p role="status" className="mt-2 text-sm">
          {error}
        </p>
      )}
    </aside>
  );
}
