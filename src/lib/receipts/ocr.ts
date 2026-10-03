import type { Worker } from "tesseract.js";
import { parseReceipt, type ReceiptSuggestion } from "./parse";

/** Images stay in the browser; worker, WASM and languages come from our origin. */
export async function recognizeReceipt(
  file: File,
  signal: AbortSignal,
  progress: (message: string) => void,
): Promise<ReceiptSuggestion> {
  let worker: Worker | undefined;
  let finished = false;
  let rejectStopped: (reason: Error) => void = () => {};
  const stopped = new Promise<never>((_, reject) => {
    rejectStopped = reject;
  });
  const abort = () =>
    rejectStopped(new DOMException("Pembacaan dibatalkan.", "AbortError"));
  const timeout = setTimeout(
    () =>
      rejectStopped(
        new Error(
          "Pembacaan terlalu lama. Isi transaksi secara manual atau coba foto yang lebih jelas.",
        ),
      ),
    60000,
  );
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) abort();
  const read = async () => {
    const { createWorker } = await import("tesseract.js");
    if (finished || signal.aborted)
      throw new DOMException("Pembacaan dibatalkan.", "AbortError");
    const created = await createWorker(["ind", "eng"], 1, {
      workerPath: "/ocr/worker.min.js",
      corePath: "/ocr/core",
      langPath: "/ocr/bahasa",
      workerBlobURL: false,
      logger: ({ status, progress: percent }) => {
        if (finished || signal.aborted) return;
        progress(
          status === "recognizing text"
            ? `Membaca struk… ${Math.round(percent * 100)}%`
            : "Menyiapkan pembaca struk… Penggunaan pertama dapat memerlukan waktu lebih lama.",
        );
      },
      errorHandler: () =>
        rejectStopped(
          new Error(
            "Pembaca struk belum dapat dijalankan. Isi transaksi secara manual atau coba kembali.",
          ),
        ),
    });
    worker = created;
    if (finished || signal.aborted) {
      await created.terminate();
      throw new DOMException("Pembacaan dibatalkan.", "AbortError");
    }
    await created.setParameters({
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });
    const { data } = await created.recognize(file);
    if (data.confidence < 40 || !data.text.trim())
      return { merchant: null, total: null, date: null };
    return parseReceipt(data.text);
  };
  try {
    return await Promise.race([read(), stopped]);
  } finally {
    finished = true;
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
    if (worker) await worker.terminate();
  }
}
