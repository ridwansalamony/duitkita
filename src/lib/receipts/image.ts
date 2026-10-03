export async function resizeReceipt(
  file: File,
  maxWidth = 1600,
): Promise<File> {
  if (
    !["image/jpeg", "image/png"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw new Error("Pilih foto JPG/PNG maksimal 5 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(
      1,
      maxWidth / bitmap.width,
      maxWidth / bitmap.height,
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Foto tidak dapat diproses.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error("Foto tidak dapat diproses.")),
        "image/jpeg",
        0.85,
      ),
    );
    return new File([blob], "struk.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
