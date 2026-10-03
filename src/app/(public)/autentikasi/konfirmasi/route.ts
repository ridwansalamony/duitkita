import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const origin=new URL(process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000").origin;
  const code = request.nextUrl.searchParams.get("code");
  const requested = request.nextUrl.searchParams.get("next") || "";
  const next =
    requested === "/atur-kata-sandi" ||
    /^\/undang\/[A-Za-z0-9-]{1,12}$/.test(requested)
      ? requested
      : "/pengaturan-awal";
  if (code) {
    const { error } = await (
      await supabaseServer()
    ).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(
    new URL("/masuk?pesan=tautan-kedaluwarsa", origin),
  );
}
