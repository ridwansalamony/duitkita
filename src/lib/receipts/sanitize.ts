import sharp from "sharp";

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

// Decode only supported raster formats, bound decoded work, and strip metadata.
// The server must enforce this too; browser validation can be bypassed.
export async function sanitizeReceipt(file: File) {
  if (
    !["image/jpeg", "image/png"].includes(file.type) ||
    !file.size ||
    file.size > MAX_RECEIPT_BYTES
  )
    throw new Error("Pilih foto JPG/PNG maksimal 5 MB.");
  const input = Buffer.from(await file.arrayBuffer());
  const expectedFormat = file.type === "image/jpeg" ? "jpeg" : "png";
  const signatureMatches =
    expectedFormat === "jpeg"
      ? input[0] === 255 && input[1] === 216 && input[2] === 255
      : [137, 80, 78, 71, 13, 10, 26, 10].every(
          (byte, index) => input[index] === byte,
        );
  if (!signatureMatches)
    throw new Error("Isi file tidak sesuai format JPG/PNG.");
  const image = sharp(input, {
    limitInputPixels: 20_000_000,
    failOn: "warning",
  });
  try {
    const metadata = await image.metadata();
    if (metadata.format !== expectedFormat || (metadata.pages ?? 1) > 1)
      throw new Error("Isi file tidak sesuai format JPG/PNG.");
    const bytes = await image
      .autoOrient()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 85 })
      .timeout({ seconds: 5 })
      .toBuffer();
    if (bytes.length > MAX_RECEIPT_BYTES)
      throw new Error("Foto terlalu besar.");
    return bytes;
  } finally {
    image.destroy();
  }
}
