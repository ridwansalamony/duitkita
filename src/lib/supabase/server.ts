import { supabasePublicKey } from "@/lib/supabase/public-key";
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { appUrl } from "@/lib/app-url";
export async function supabaseServer() {
  const jar = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabasePublicKey();
  if (!url || !key)
    throw new Error("Lengkapi konfigurasi Supabase di .env.local.");
  return createServerClient(url, key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV === "production" && appUrl().startsWith("https:"),
    },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          /* Middleware memperbarui cookie dari Server Component. */
        }
      },
    },
  });
}
