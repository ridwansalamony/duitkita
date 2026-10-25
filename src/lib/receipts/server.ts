import "server-only";
import { enforceRateLimit } from "@/lib/security/rate-limit";

import { supabaseServer } from "@/lib/supabase/server";
import { withIdentity } from "@/db";
import { sanitizeReceipt } from "./sanitize";

export async function storeReceipt(file: File, rateLimitChecked = false) {
  const identity = await withIdentity(async (_tx, id) => id);
  if (!rateLimitChecked) await enforceRateLimit("receipt", identity.userId);
  const bytes = await sanitizeReceipt(file);
  const path = `${identity.familyId}/${identity.userId}/${Date.now()}-${crypto.randomUUID()}.jpg`;
  const client = await supabaseServer();
  const { error } = await client.storage
    .from("receipts")
    .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
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
