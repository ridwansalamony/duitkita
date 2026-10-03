import { getWorkspace } from "@/db/queries";
export const dynamic = "force-dynamic";
export async function GET() {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  try {
    // Verifikasi sesi dan family_id dilakukan oleh withIdentity, termasuk RLS.
    return Response.json(
      { success: true, ...(await getWorkspace()) },
      { headers },
    );
  } catch (error) {
    const anonymous =
      error instanceof Error &&
      error.message === "Sesi berakhir. Silakan masuk kembali.";
    return Response.json(
      { success: false, error: "Data keluarga belum dapat disegarkan." },
      { status: anonymous ? 401 : 503, headers },
    );
  }
}
