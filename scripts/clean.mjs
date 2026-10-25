import { lstat, realpath, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = await realpath(fileURLToPath(new URL("../", import.meta.url)));
const targets = [
  ".next",
  ".next-demo",
  ".next-design",
  ".next-review-live",
  "playwright-report",
  "tsconfig.tsbuildinfo",
];
if (process.argv.includes("--tests")) targets.push("test-results");
for (const name of targets) {
  const target = join(root, name);
  let entry;
  try {
    entry = await lstat(target);
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  // Do not follow junctions/symlinks or accept a user-supplied deletion path.
  if (
    dirname(target) !== root ||
    entry.isSymbolicLink() ||
    (await realpath(target)) !== target
  )
    throw new Error(`Target pembersihan tidak aman: ${name}`);
  console.log(
    `${process.argv.includes("--dry-run") ? "Akan dibersihkan" : "Membersihkan"}: ${name}`,
  );
  if (!process.argv.includes("--dry-run"))
    await rm(target, { recursive: entry.isDirectory(), force: false });
}
