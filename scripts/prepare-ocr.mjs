import { createRequire } from "node:module";
import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const tesseract = dirname(require.resolve("tesseract.js/package.json"));
const core = dirname(
  createRequire(join(tesseract, "package.json")).resolve(
    "tesseract.js-core/package.json",
  ),
);
const target = new URL("../public/ocr/", import.meta.url);
await mkdir(new URL("core/", target), { recursive: true });
await mkdir(new URL("bahasa/", target), { recursive: true });
await copyFile(
  join(tesseract, "dist/worker.min.js"),
  new URL("worker.min.js", target),
);
await copyFile(
  join(tesseract, "LICENSE.md"),
  new URL("LICENSE-tesseract.txt", target),
);
for (const file of await readdir(core)) {
  if (/\.wasm(?:\.js)?$/.test(file) || /^LICENSE/.test(file)) {
    await copyFile(join(core, file), new URL(`core/${file}`, target));
  }
}
for (const language of ["ind", "eng"]) {
  const root = dirname(
    require.resolve(`@tesseract.js-data/${language}/package.json`),
  );
  await copyFile(
    join(root, `4.0.0_best_int/${language}.traineddata.gz`),
    new URL(`bahasa/${language}.traineddata.gz`, target),
  );
}
console.log(
  "Aset OCR Indonesia dan Inggris siap, disajikan dari aplikasi sendiri.",
);
