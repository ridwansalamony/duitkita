import { RateLimitError } from "@/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { getFinancialReport } from "@/db/reports";
import { reportFilter } from "@/lib/reports";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const parsed = reportFilter.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Periksa rentang tanggal laporan." },
      { status: 400, headers },
    );
  try {
    return NextResponse.json(await getFinancialReport(parsed.data), {
      headers,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sesi berakhir. Silakan masuk kembali."
    )
      return NextResponse.json(
        { error: "Silakan masuk kembali." },
        { status: 401, headers },
      );
    if (error instanceof RateLimitError)
      return NextResponse.json(
        { error: error.message },
        {
          status: error.status,
          headers: { ...headers, "Retry-After": String(error.retryAfter) },
        },
      );
    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          error.message.startsWith("Laporan terlalu besar.")
            ? error.message
            : "Laporan belum dapat dimuat. Coba kembali.",
      },
      {
        status:
          error instanceof Error &&
          error.message.startsWith("Laporan terlalu besar.")
            ? 422
            : 503,
        headers,
      },
    );
  }
}
