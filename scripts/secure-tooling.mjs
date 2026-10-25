import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

// npm postinstall: keep the existing depth-limit mitigation on the dependency
// actually used by Next's lint plugin. Production installs may omit this tooling.
const require = createRequire(import.meta.url);
let nextEntry;
try {
  nextEntry = require.resolve("eslint-config-next");
} catch (error) {
  if (error.code === "MODULE_NOT_FOUND") process.exit(0);
  throw error;
}
const nextRequire = createRequire(nextEntry);
const pluginRequire = createRequire(
  nextRequire.resolve("@next/eslint-plugin-next"),
);
const globRequire = createRequire(pluginRequire.resolve("fast-glob"));
const microRequire = createRequire(globRequire.resolve("micromatch"));
const packagePath = microRequire.resolve("braces/package.json");
if (JSON.parse(readFileSync(packagePath, "utf8")).version !== "3.0.3")
  throw new Error(
    "Tinjau ulang mitigasi dependency tooling untuk versi yang terpasang.",
  );
const root = dirname(packagePath);
function update(file, edits) {
  const target = join(root, "lib", file);
  let source = readFileSync(target, "utf8").replace(/\r\n/g, "\n");
  for (const [before, after, count = 1] of edits) {
    if (source.split(after).length - 1 === count) continue;
    if (source.split(before).length - 1 !== count)
      throw new Error(`Struktur dependency tooling berubah: ${file}`);
    source = source.replaceAll(before, after);
  }
  writeFileSync(target, source);
}
const limit =
  "if (depth >= 256) throw new SyntaxError('Brace nesting exceeds the safety limit');";
for (const file of ["compile.js", "expand.js"])
  update(file, [
    [
      "const walk = (node, parent = {}) => {",
      `const walk = (node, parent = {}, depth = 0) => {\n    ${limit}`,
    ],
    ["walk(child, node)", "walk(child, node, depth + 1)"],
  ]);
update("parse.js", [
  [
    "stack.push(block);",
    "if (stack.length >= 256) throw new SyntaxError('Brace nesting exceeds the safety limit');\n      stack.push(block);",
    2,
  ],
]);
update("stringify.js", [
  [
    "const stringify = (node, parent = {}) => {",
    `const stringify = (node, parent = {}, depth = 0) => {\n    ${limit}`,
  ],
  ["stringify(child)", "stringify(child, {}, depth + 1)"],
]);
console.log("Mitigasi parser dependency tooling siap.");
