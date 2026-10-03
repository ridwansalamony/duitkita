import "server-only";
import { enforceRateLimit } from "@/lib/security/rate-limit";

import { supabaseServer } from "@/lib/supabase/server";
import { withIdentity } from "@/db";

export async function storeReceipt(file: File, rateLimitChecked = false) {
  if (
    !["image/jpeg", "image/png"].includes(file.type) ||
    file.size === 0 ||
    file.size > 5 * 1024 * 1024
  )
    throw new Error("Pilih foto JPG/PNG maksimal 5 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const valid =
    file.type === "image/jpeg"
      ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b);
  if (!valid) throw new Error("Isi file tidak sesuai format JPG/PNG.");
  const identity = await withIdentity(async (_tx, id) => id);
  if (!rateLimitChecked) await enforceRateLimit("receipt", identity.userId);
  const path = `${identity.familyId}/${identity.userId}/${Date.now()}-${crypto.randomUUID()}.${file.type === "image/jpeg" ? "jpg" : "png"}`;
  const client = await supabaseServer();
  const { error } = await client.storage
    .from("receipts")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (error)
    throw new Error(
      "Struk belum terunggah. Periksa koneksi dan konfigurasi Storage.",
    );
  const { data: signed, error: signError } = await client.storage
    .from("receipts")
    .createSignedUrl(path, 3600);
  if (signError || !signed) throw new Error("Pratinjau struk belum tersedia.");
  return { path, url: signed.signedUrl };
}
