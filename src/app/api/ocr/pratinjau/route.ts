import { enforceRateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { storeReceipt } from "@/lib/receipts/server";
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
  try { await enforceRateLimit("receipt", user.id); } catch (error) {
    return new Response(error instanceof RateLimitError ? error.message : "Layanan belum tersedia", { status: error instanceof RateLimitError ? error.status : 503, headers: { "Retry-After": String(error instanceof RateLimitError ? error.retryAfter : 60), "Cache-Control": "no-store" } });
  }
  const length = Number(request.headers.get("content-length"));
  if (length > 6 * 1024 * 1024)
    return new Response("Ukuran unggahan tidak valid", { status: 413 });
  const reader = request.body?.getReader();
  if (!reader) return new Response("Pilih foto struk", { status: 400 });
  const chunks: ArrayBuffer[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 6 * 1024 * 1024) {
      await reader.cancel();
      return new Response("Ukuran unggahan tidak valid", { status: 413 });
    }
    chunks.push(Uint8Array.from(value).buffer);
  }
  let form: FormData;
  try {
    form = await new Response(new Blob(chunks), {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
  } catch {
    return new Response("Format unggahan tidak valid", { status: 400 });
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
