export class RequestBodyError extends Error {
  constructor(public status: 400 | 408 | 413) {
    super(
      status === 413
        ? "Ukuran unggahan tidak valid"
        : status === 408
          ? "Unggah terlalu lama. Coba kembali."
          : "Format unggahan tidak valid",
    );
  }
}

export async function readBoundedBody(
  request: Request,
  maxBytes: number,
  timeoutMs = 20_000,
): Promise<Blob> {
  const declared = request.headers.get("content-length");
  if (
    declared !== null &&
    (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)))
  )
    throw new RequestBodyError(400);
  if (declared !== null && Number(declared) > maxBytes)
    throw new RequestBodyError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError(400);
  const chunks: ArrayBuffer[] = [];
  let size = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new RequestBodyError(408)), timeoutMs);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new RequestBodyError(413);
      chunks.push(Uint8Array.from(value).buffer);
    }
    return new Blob(chunks);
  } catch (error) {
    // Do not let cancellation of a hostile stream keep the request alive.
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
