import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { readBoundedBody } from "../src/lib/security/request-body";
import {
  sanitizeReceipt,
  MAX_RECEIPT_BYTES,
} from "../src/lib/receipts/sanitize";

function streamed(
  body: ReadableStream<Uint8Array>,
  headers: Record<string, string> = {},
) {
  return new Request("http://localhost/upload", {
    method: "POST",
    body,
    headers,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}
test("body tanpa Content-Length tetap dibatasi dan stream dibatalkan", async () => {
  let canceled = false;
  const request = streamed(
    new ReadableStream({
      start(c) {
        c.enqueue(new Uint8Array(6));
        c.enqueue(new Uint8Array(6));
      },
      cancel() {
        canceled = true;
      },
    }),
  );
  await expect(readBoundedBody(request, 10)).rejects.toMatchObject({
    status: 413,
  });
  expect(canceled).toBe(true);
});
test("Content-Length palsu tidak dapat melewati batas aktual", async () => {
  const request = streamed(
    new ReadableStream({
      start(c) {
        c.enqueue(new Uint8Array(12));
        c.close();
      },
    }),
    { "content-length": "1" },
  );
  await expect(readBoundedBody(request, 10)).rejects.toMatchObject({
    status: 413,
  });
});
test("ukuran deklarasi rusak dan terlalu besar ditolak sebelum membaca stream", async () => {
  for (const [value, status] of [
    ["-1", 400],
    ["bukan-angka", 400],
    ["9007199254740992", 400],
    ["11", 413],
  ] as const) {
    const request = new Request("http://localhost/upload", {
      method: "POST",
      body: "abc",
      headers: { "content-length": value },
    });
    await expect(readBoundedBody(request, 10)).rejects.toMatchObject({
      status,
    });
    expect(request.bodyUsed).toBe(false);
  }
});
test("stream macet berhenti pada deadline tanpa menunggu cancel selesai", async () => {
  let canceled = false;
  const request = streamed(
    new ReadableStream({
      cancel() {
        canceled = true;
        return new Promise(() => {});
      },
    }),
  );
  await expect(readBoundedBody(request, 10, 20)).rejects.toMatchObject({
    status: 408,
  });
  expect(canceled).toBe(true);
});
test("body valid tepat pada batas mempertahankan semua byte", async () => {
  const request = new Request("http://localhost/upload", {
    method: "POST",
    body: "Budi & Sari",
  });
  expect(await (await readBoundedBody(request, 11)).text()).toBe("Budi & Sari");
});
test("foto struk dinormalisasi, diperkecil, dan metadata dibuang", async () => {
  const input = await sharp({
    create: { width: 2000, height: 1000, channels: 3, background: "white" },
  })
    .png()
    .withMetadata({ orientation: 1 })
    .toBuffer();
  const output = await sanitizeReceipt(
    new File([new Uint8Array(input)], "struk.png", { type: "image/png" }),
  );
  const metadata = await sharp(output).metadata();
  expect(metadata.format).toBe("jpeg");
  expect(metadata.width).toBe(1600);
  expect(metadata.height).toBe(800);
  expect(metadata.exif).toBeUndefined();
  expect(metadata.icc).toBeUndefined();
});
test("HTML/SVG menyamar dan JPEG rusak tidak boleh diunggah", async () => {
  for (const bytes of [
    new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    new Uint8Array([255, 216, 255, 0, 0, 0]),
  ]) {
    await expect(
      sanitizeReceipt(new File([bytes], "struk.jpg", { type: "image/jpeg" })),
    ).rejects.toThrow();
  }
});
test("foto dengan MIME palsu, kosong atau terlalu besar ditolak", async () => {
  const png = await sharp({
    create: { width: 2, height: 2, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  for (const file of [
    new File([new Uint8Array(png)], "struk.jpg", { type: "image/jpeg" }),
    new File([], "struk.png", { type: "image/png" }),
    new File([new Uint8Array(MAX_RECEIPT_BYTES + 1)], "struk.png", {
      type: "image/png",
    }),
  ])
    await expect(sanitizeReceipt(file)).rejects.toThrow();
});
test("gambar terkompresi kecil dengan dimensi berlebihan ditolak", async () => {
  const png = await sharp({
    create: { width: 5000, height: 5000, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  expect(png.length).toBeLessThan(MAX_RECEIPT_BYTES);
  await expect(
    sanitizeReceipt(
      new File([new Uint8Array(png)], "struk.png", { type: "image/png" }),
    ),
  ).rejects.toThrow(/pixel limit/);
});
