import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { runInNewContext } from "node:vm";

async function limiter(env: Record<string, string>, result?: object) {
  const bundle = await build({
    entryPoints: ["src/lib/security/rate-limit.ts"],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    external: ["node:crypto"],
    plugins: [
      {
        name: "boundary",
        setup(b) {
          b.onResolve(
            {
              filter:
                /^(server-only|next\/headers|@upstash\/redis|@upstash\/ratelimit)$/,
            },
            (a) => ({ path: a.path, namespace: "stub" }),
          );
          b.onLoad({ filter: /.*/, namespace: "stub" }, (a) => ({
            contents:
              a.path === "server-only"
                ? ""
                : a.path === "next/headers"
                  ? "export async function headers(){return new Map()}"
                  : a.path === "@upstash/redis"
                    ? "export class Redis {}"
                    : `export class Ratelimit {static slidingWindow(){} async limit(){return ${JSON.stringify(result ?? { success: true, reset: 0 })}}}`,
          }));
        },
      },
    ],
  });
  const { createRequire } = await import("node:module");
  const testModule = { exports: {} };
  runInNewContext(bundle.outputFiles[0].text, {
    URL,
    module: testModule,
    exports: testModule.exports,
    require: createRequire(__filename),
    process: { env },
  });
  return testModule.exports as {
    enforceRateLimit: (kind: string, id?: string) => Promise<void>;
  };
}

test("rate limit lokal menolak percobaan keenam dan memisahkan identitas", async () => {
  const service = await limiter({});
  for (let i = 0; i < 5; i++)
    await service.enforceRateLimit("register", "budi");
  expect(
    await service
      .enforceRateLimit("register", "budi")
      .catch((e) => ({ status: e.status })),
  ).toEqual({ status: 429 });
  expect(await service.enforceRateLimit("register", "sari")).toBeUndefined();
});
test("production menolak request jika Upstash belum tersedia atau timeout", async () => {
  const missing = await limiter({ VERCEL: "1" });
  expect(
    await missing
      .enforceRateLimit("login")
      .catch((e) => ({ status: e.status })),
  ).toEqual({ status: 503 });
  const timeout = await limiter(
    {
      VERCEL: "1",
      UPSTASH_REDIS_REST_URL: "https://test.invalid",
      UPSTASH_REDIS_REST_TOKEN: "test",
    },
    { success: true, reason: "timeout", reset: 0 },
  );
  expect(
    await timeout
      .enforceRateLimit("login")
      .catch((e) => ({ status: e.status })),
  ).toEqual({ status: 503 });
});
test("penolakan Upstash menjadi 429", async () => {
  const service = await limiter(
    {
      UPSTASH_REDIS_REST_URL: "https://test.invalid",
      UPSTASH_REDIS_REST_TOKEN: "test",
    },
    { success: false, reset: Date.now() + 60000 },
  );
  expect(
    await service
      .enforceRateLimit("report", "budi")
      .catch((e) => ({ status: e.status })),
  ).toEqual({ status: 429 });
});
