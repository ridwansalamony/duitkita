import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";

// Resolve the actual transitive dependency used by Next's lint plugin, so this
// checks the installed npm postinstall mitigation rather than a separate test copy.
const requireHere = createRequire(__filename);
const nextRequire = createRequire(requireHere.resolve("eslint-config-next"));
const pluginRequire = createRequire(
  nextRequire.resolve("@next/eslint-plugin-next"),
);
const globRequire = createRequire(pluginRequire.resolve("fast-glob"));
const microRequire = createRequire(globRequire.resolve("micromatch"));
type Ast = { type: string; nodes?: Ast[]; value?: string };
const braces = microRequire("braces") as {
  compile: (input: string | Ast) => string;
  expand: (input: string | Ast) => string[];
  stringify: (input: string | Ast) => string;
  parse: (input: string) => Ast;
};
test("patch braces mempertahankan glob normal", () => {
  expect(braces.expand("src/{app,lib}/*.ts")).toEqual([
    "src/app/*.ts",
    "src/lib/*.ts",
  ]);
  expect(braces.compile("{a,b}")).toBe("(a|b)");
});
test("pola nesting berbahaya dan AST dalam ditolak sebelum stack overflow", () => {
  const input = "{".repeat(3000) + "a,b" + "}".repeat(3000);
  for (const operation of [
    braces.parse,
    braces.compile,
    braces.expand,
    braces.stringify,
  ])
    expect(() => operation(input)).toThrow(/safety limit/);
  let ast: Ast = { type: "text", value: "a" };
  for (let i = 0; i < 10000; i++) ast = { type: "root", nodes: [ast] };
  for (const operation of [braces.compile, braces.expand, braces.stringify])
    expect(() => operation(ast)).toThrow(/safety limit/);
});
