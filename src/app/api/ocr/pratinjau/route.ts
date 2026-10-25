import { enforceRateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { storeReceipt } from "@/lib/receipts/server";
import { readBoundedBody, RequestBodyError } from "@/lib/security/request-body";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: NextRequest) {
  // Route handler tidak menerima perlindungan CSRF Server Actions.
  if (
    request.headers.get("origin") !==
    new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin
  )
    return new Response("Permintaan tidak diizinkan", { status: 403 });
  const {
    data: { user },
  } = await (await supabaseServer()).auth.getUser();
  if (!user) return new Response("Silakan masuk kembali", { status: 401 });
  try {
    await enforceRateLimit("receipt", user.id);
  } catch (error) {
    return new Response(
      error instanceof RateLimitError
        ? error.message
        : "Layanan belum tersedia",
      {
        status: error instanceof RateLimitError ? error.status : 503,
        headers: {
          "Retry-After": String(
            error instanceof RateLimitError ? error.retryAfter : 60,
          ),
          "Cache-Control": "no-store",
        },
      },
    );
  }
  let form: FormData;
  try {
    const body = await readBoundedBody(request, 6 * 1024 * 1024);
    form = await new Response(body, {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
  } catch (error) {
    return new Response(
      error instanceof RequestBodyError
        ? error.message
        : "Format unggahan tidak valid",
      {
        status: error instanceof RequestBodyError ? error.status : 400,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
  const file = form.get("file");
  if (!(file instanceof File))
    return new Response("Pilih foto struk", { status: 400 });
  const encoder = new TextEncoder();
  let canceled = false;
  const stream = new ReadableStream({
    cancel() {
      canceled = true;
    },
    async start(controller) {
      const send = (data: unknown) => {
        if (!canceled)
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };
      try {
        send({ status: "Mengunggah struk…" });
        const { path, url } = await storeReceipt(file, true);
        send({ done: true, status: "Struk tersimpan.", path, url });
      } catch {
        send({
          error:
            "Struk belum terunggah. Pilih JPG/PNG maksimal 5 MB dan coba kembali.",
        });
      } finally {
        if (!canceled) controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
