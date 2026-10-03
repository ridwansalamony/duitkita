"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  Context,
  validateTransactionFunds,
  type DemoData,
  type Store,
} from "@/lib/dummy/store";
import { mutate, realtimeToken } from "@/actions/finance";
import { mutationIntent } from "./intent";
import { Button } from "@/components/ui/button";
import { insufficientFundsMessage } from "./funds";
import { optimisticBalances } from "./optimistic";
export function WorkspaceProvider({
  initial,
  userId,
  familyId,
  children,
}: {
  initial: DemoData;
  userId: string;
  familyId: string;
  children: React.ReactNode;
}) {
  const [data, setData] = useState(initial),
    [syncFailed, setSyncFailed] = useState(false);
  const current = useRef(initial),
    busy = useRef(false),
    mounted = useRef(true),
    refreshing = useRef(false),
    revision = useRef(0),
    refreshAgain = useRef(false),
    refreshController = useRef<AbortController | null>(null);
  const assign = useCallback((next: DemoData) => {
    current.current = next;
    if (mounted.current) setData(next);
  }, []);
  const refresh = useCallback(async () => {
    refreshAgain.current = true;
    if (busy.current || refreshing.current || !mounted.current) return;
    refreshing.current = true;
    try {
      do {
        refreshAgain.current = false;
        const version = revision.current;
        const controller = new AbortController();
        refreshController.current = controller;
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
          // GET tidak ikut antrean Server Actions, sehingga tidak menahan simpan berikutnya.
          const response = await fetch("/api/ruang-keluarga", {
            cache: "no-store",
            signal: controller.signal,
          });
          const result = await response.json();
          if (!mounted.current || version !== revision.current || busy.current)
            continue;
          if (
            !response.ok ||
            !result.success ||
            result.identity.familyId !== familyId
          )
            throw new Error("refresh");
          assign(result.data);
          setSyncFailed(false);
        } catch {
          if (mounted.current && version === revision.current && !busy.current)
            setSyncFailed(true);
        } finally {
          clearTimeout(timeout);
        }
      } while (refreshAgain.current && !busy.current && mounted.current);
    } finally {
      refreshing.current = false;
    }
  }, [assign, familyId]);
  useEffect(() => {
    mounted.current = true;
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
    let stopped = false;
    async function connect() {
      const token = await realtimeToken();
      if (stopped || !token) return;
      await client.realtime.setAuth(token);
      client
        .channel(`keluarga:${familyId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "audit_logs",
            filter: `family_id=eq.${familyId}`,
          },
          () => void refresh(),
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") void refresh();
        });
    }
    void connect().catch(() => {
      /* Polling tetap tersedia ketika Realtime terputus. */
    });
    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    // Audit INSERT memicu refresh untuk create/update/delete semua entitas.
    // RLS audit tetap melindungi data antar keluarga; polling menjadi fallback koneksi Realtime.
    const poll = setInterval(onFocus, 15000);
    const renew = setInterval(
      () =>
        void realtimeToken()
          .then((token) => {
            if (token && !stopped) void client.realtime.setAuth(token);
          })
          .catch(() => {}),
      120000,
    );
    return () => {
      mounted.current = false;
      stopped = true;
      refreshController.current?.abort();
      clearInterval(poll);
      clearInterval(renew);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      void client.removeAllChannels();
    };
  }, [familyId, refresh]);
  const update: Store["update"] = async (fn) => {
    if (busy.current) {
      toast.info("Tunggu catatan sebelumnya selesai disimpan.");
      return false;
    }
    const before = current.current,
      after = fn(before);
    if (!validateTransactionFunds(before, after, familyId)) {
      toast.error(insufficientFundsMessage);
      return false;
    }
    busy.current = true;
    revision.current++;
    refreshController.current?.abort();
    try {
      const intent = mutationIntent(before, after, userId);
      const next = optimisticBalances(before, after);
      // Jangan hilangkan halaman/dialog hapus saat server belum mengonfirmasi.
      // Kode undangan harus memakai nilai resmi dari server, bukan tebakan klien.
      const afterCommit =
        intent.action === "delete" || intent.entity === "invite";
      if (!afterCommit) assign(next);
      const result = await mutate(intent);
      if (!result.success) {
        assign(before);
        toast.error(result.error);
        return false;
      }
      // Sukses mengikuti commit server, bukan pemuatan ulang seluruh workspace.
      if (afterCommit) assign(next);
      if (result.family) assign({ ...current.current, ...result.family });
      return true;
    } catch {
      assign(before);
      toast.error(
        "Koneksi terputus. Muat ulang untuk memeriksa status catatan sebelum mencoba kembali.",
      );
      return false;
    } finally {
      busy.current = false;
      // Revision mencegah respons refresh lama menimpa mutasi baru/rollback.
      revision.current++;
      void refresh();
    }
  };
  const user = data.users.find((u) => u.id === userId)!;
  return (
    <Context.Provider
      value={{
        data,
        user,
        familyId,
        update,
        setUserId: () => {},
        reset: () => {},
        log: (current) => current.logs,
      }}
    >
      {syncFailed && (
        <div
          role="status"
          className="fixed bottom-24 right-5 z-40 max-w-xs rounded-xl border bg-card p-3 text-xs shadow-lg"
        >
          Data terbaru belum tersinkron. Perubahan yang sudah dikonfirmasi tetap
          tersimpan.
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={refresh}
          >
            Coba sinkronkan
          </Button>
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
