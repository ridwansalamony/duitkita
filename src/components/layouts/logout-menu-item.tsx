"use client";
import { useRef, useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { toast } from "sonner";
import { logout } from "@/actions/auth";
import { isDemo } from "@/lib/mode";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function LogoutMenuItem() {
  const [leaving, setLeaving] = useState(false);
  const pending = useRef(false);
  return (
    <DropdownMenuItem
      disabled={leaving}
      aria-busy={leaving}
      onSelect={async (event) => {
        event.preventDefault();
        if (pending.current) return;
        pending.current = true;
        setLeaving(true);
        try {
          if (!isDemo) {
            const result = await logout();
            if (!result.success) throw new Error(result.error);
          }
          // Keep the control busy until navigation discards the authenticated UI.
          window.location.replace(isDemo ? "/" : "/masuk");
        } catch {
          toast.error("Belum berhasil keluar. Coba kembali.");
          pending.current = false;
          setLeaving(false);
        }
      }}
    >
      {leaving ? <LoaderCircle className="animate-spin" /> : <LogOut />}
      {leaving ? "Keluar…" : isDemo ? "Keluar dari demo" : "Keluar"}
    </DropdownMenuItem>
  );
}
