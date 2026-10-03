"use server";
import { storeReceipt } from "@/lib/receipts/server";
export async function uploadReceipt(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File))
    return { error: "Pilih foto struk terlebih dahulu." };
  try {
    return await storeReceipt(file);
  } catch {
    return {
      error:
        "Unggah belum berhasil. Gunakan JPG/PNG maksimal 5 MB dan coba kembali.",
    };
  }
}
