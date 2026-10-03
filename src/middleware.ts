import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDemo } from "@/lib/mode";
const protectedPaths = [
  "/dashboard",
  "/transaksi",
  "/dompet",
  "/kategori",
  "/tabungan",
  "/laporan",
  "/riwayat-aktivitas",
  "/pengaturan",
  "/profil",
  "/pemilik",
  "/pengaturan-awal",
  "/atur-kata-sandi",
];
export async function middleware(request: NextRequest) {
  if (isDemo) return NextResponse.next();
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const protectedRoute = protectedPaths.some(
    (p) => path === p || path.startsWith(p + "/"),
  );
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    return protectedRoute
      ? NextResponse.redirect(new URL("/masuk?pesan=konfigurasi", request.url))
      : response;
  const client = createServerClient(url, key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const {
    data: { user },
  } = await client.auth.getUser();
  let destination: string | undefined;
  if (!user && protectedRoute)
    destination = `/masuk?next=${encodeURIComponent(path)}`;
  if (user && (path === "/masuk" || path === "/daftar")) {
    const next = request.nextUrl.searchParams.get("next");
    destination = next?.startsWith("/undang/") ? next : "/dashboard";
  }
  if (destination) {
    const redirect = NextResponse.redirect(new URL(destination, request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
