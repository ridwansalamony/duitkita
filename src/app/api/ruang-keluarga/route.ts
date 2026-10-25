import { refreshWorkspaceData } from "@/db/queries";
import { RateLimitError } from "@/lib/security/rate-limit";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  try {
    // Verifikasi sesi dan family_id dilakukan oleh withIdentity, termasuk RLS.
    return Response.json(
      {
        success: true,
        ...(await refreshWorkspaceData(
          request.headers.get("X-Workspace-Revision") || undefined,
        )),
      },
      { headers },
    );
  } catch (error) {
    if (error instanceof RateLimitError)
      return Response.json(
        { success: false, error: error.message },
        {
          status: error.status,
          headers: { ...headers, "Retry-After": String(error.retryAfter) },
        },
      );
    const anonymous =
      error instanceof Error &&
      error.message === "Sesi berakhir. Silakan masuk kembali.";
    const noFamily =
      error instanceof Error &&
      error.message === "Selesaikan pengaturan keluarga terlebih dahulu.";
    return Response.json(
      { success: false, error: "Data keluarga belum dapat disegarkan." },
      { status: anonymous ? 401 : noFamily ? 403 : 503, headers },
    );
  }
}
