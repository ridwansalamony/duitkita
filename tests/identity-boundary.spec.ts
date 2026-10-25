import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

type State = {
  user: { id: string } | null;
  profile: { family_id: string; role: string }[];
  events: string[];
};
let bundle: string;
test.beforeAll(async () => {
  const result = await build({
    entryPoints: ["src/db/index.ts"],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    external: ["drizzle-orm"],
    plugins: [
      {
        name: "isolated-services",
        setup(b) {
          const stubs: Record<string, string> = {
            "server-only": "",
            "./connection":
              "export function databaseConnection(){ state.events.push('connection'); return {}; }",
            "./schema": "",
            "drizzle-orm/postgres-js": "export const drizzle = () => db;",
            "@/lib/supabase/server":
              "export async function supabaseServer(){ return {auth:{getUser:async()=>{state.events.push('auth'); return {data:{user:state.user},error:null};}}}; }",
            "next/headers":
              "export async function headers(){return new Map();}",
            "@/lib/security/rate-limit":
              "export async function enforceRateLimit(){state.events.push('limit');}",
          };
          b.onResolve({ filter: /.*/ }, (args) =>
            args.path in stubs
              ? { path: args.path, namespace: "isolated" }
              : undefined,
          );
          b.onLoad({ filter: /.*/, namespace: "isolated" }, (args) => ({
            contents: stubs[args.path],
          }));
        },
      },
    ],
  });
  bundle = result.outputFiles[0].text;
});
function service(state: State) {
  const dialect = new PgDialect();
  const testModule = { exports: {} };
  const queries: { sql: string; params: unknown[] }[] = [];
  const db = {
    transaction: async (run: (tx: object) => Promise<unknown>) => {
      state.events.push("transaction");
      return run({
        execute: async (query: SQL) => {
          const parsed = dialect.sqlToQuery(query);
          queries.push(parsed);
          return parsed.sql.startsWith("select family_id, role")
            ? state.profile
            : [];
        },
      });
    },
  };
  runInNewContext(bundle, {
    state,
    db,
    module: testModule,
    exports: testModule.exports,
    require: createRequire(__filename),
    process: { env: {} },
  });
  return {
    queries,
    withIdentity: (
      testModule.exports as {
        withIdentity: (
          run: (
            tx: unknown,
            id: { userId: string; familyId: string; role: string },
          ) => Promise<unknown>,
          required?: boolean,
          options?: {
            rateLimit?: string;
            beforeTransaction?: () => Promise<void>;
          },
        ) => Promise<unknown>;
      }
    ).withIdentity,
  };
}
const userId = "00000000-0000-4000-8000-000000000001";
test("identitas anonim ditolak sebelum preflight atau pemesanan koneksi", async () => {
  const state: State = { user: null, profile: [], events: [] };
  const { withIdentity } = service(state);
  const error = await withIdentity(
    async () => {
      throw new Error("must not run");
    },
    true,
    {
      rateLimit: "mutation",
      beforeTransaction: async () => {
        state.events.push("storage");
      },
    },
  ).catch((e) => e.message);
  expect(error).toBe("Sesi berakhir. Silakan masuk kembali.");
  expect(state.events).toEqual(["auth"]);
});
test("Storage gagal tidak mengambil slot database", async () => {
  const state: State = { user: { id: userId }, profile: [], events: [] };
  const { withIdentity } = service(state);
  const error = await withIdentity(async () => null, true, {
    rateLimit: "mutation",
    beforeTransaction: async () => {
      state.events.push("storage");
      throw new Error("storage down");
    },
  }).catch((e) => e.message);
  expect(error).toBe("storage down");
  expect(state.events).toEqual(["auth", "limit", "storage"]);
});
test("keluarga dan role diturunkan dari profil serta dipasang dengan SET LOCAL", async () => {
  const state: State = {
    user: { id: userId },
    profile: [
      {
        family_id: "00000000-0000-4000-8000-000000000002",
        role: "admin-palsu",
      },
    ],
    events: [],
  };
  const { withIdentity, queries } = service(state);
  const identity = await withIdentity(async (_tx, id) => id, true, {
    rateLimit: "mutation",
    beforeTransaction: async () => {
      state.events.push("storage");
    },
  });
  expect(identity).toEqual({
    userId,
    familyId: state.profile[0].family_id,
    role: "member",
  });
  expect(state.events).toEqual([
    "auth",
    "limit",
    "storage",
    "connection",
    "transaction",
  ]);
  expect(queries.some((q) => q.sql === "set local role authenticated")).toBe(
    true,
  );
  const claims = queries.filter((q) => q.sql.includes("request.jwt.claims"));
  expect(claims).toHaveLength(2);
  expect(claims[1].params).toContain(
    JSON.stringify({
      sub: userId,
      role: "authenticated",
      family_id: state.profile[0].family_id,
    }),
  );
  expect(claims.every((q) => q.sql.includes(", true)"))).toBe(true);
});
test("profil tanpa keluarga tidak boleh membaca workspace", async () => {
  const state: State = { user: { id: userId }, profile: [], events: [] };
  const { withIdentity } = service(state);
  let read = false;
  const error = await withIdentity(async () => {
    read = true;
    return null;
  }).catch((e) => e.message);
  expect(error).toBe("Selesaikan pengaturan keluarga terlebih dahulu.");
  expect(read).toBe(false);
});
