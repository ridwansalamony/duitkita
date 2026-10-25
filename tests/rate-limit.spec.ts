import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { runInNewContext } from "node:vm";
import { trustedRequestIp } from "../src/lib/security/request-ip";

async function limiter(
  env: Record<string, string>,
  clock = { now: Date.now() },
) {
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
              filter: /^(server-only|next\/headers)$/,
            },
            (a) => ({ path: a.path, namespace: "stub" }),
          );
          b.onLoad({ filter: /.*/, namespace: "stub" }, (a) => ({
            contents:
              a.path === "server-only"
                ? ""
                : "export async function headers(){return new Map()}",
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
    Date: class extends Date {
      static now() {
        return clock.now;
      }
    },
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

test("limiter membuka jendela baru tepat saat expired", async () => {
  const clock = { now: 1_000_000 };
  const service = await limiter({}, clock);
  for (let i = 0; i < 30; i++)
    await service.enforceRateLimit("mutation", "budi");
  clock.now += 59_999;
  expect(
    await service
      .enforceRateLimit("mutation", "budi")
      .catch((error) => error.status),
  ).toBe(429);
  clock.now++;
  expect(await service.enforceRateLimit("mutation", "budi")).toBeUndefined();
});

test("kapasitas bucket penuh menolak identitas baru tetapi tidak memblokir bucket aktif", async () => {
  const service = await limiter({});
  for (let i = 0; i < 10_000; i++)
    await service.enforceRateLimit("mutation", `user-${i}`);
  expect(await service.enforceRateLimit("mutation", "user-0")).toBeUndefined();
  expect(
    await service
      .enforceRateLimit("mutation", "baru")
      .catch((error) => error.status),
  ).toBe(429);
});

test("IP audit tidak mempercayai header forwarding dari deployment tanpa trust boundary", () => {
  const spoofed = new Headers({
    "x-forwarded-for": "192.0.2.1",
    "x-vercel-forwarded-for": "192.0.2.2",
  });
  expect(trustedRequestIp(spoofed, false)).toBeUndefined();
  expect(trustedRequestIp(spoofed, true)).toBe("192.0.2.2");
  expect(
    trustedRequestIp(
      new Headers({ "x-vercel-forwarded-for": "bukan-ip" }),
      true,
    ),
  ).toBeUndefined();
});
test("production tanpa Upstash tetap berjalan dan membatasi request", async () => {
  const service = await limiter({ VERCEL: "1" });
  for (let i = 0; i < 20; i++) await service.enforceRateLimit("login");
  expect(
    await service.enforceRateLimit("login").catch((error) => error.status),
  ).toBe(429);
  expect(await service.enforceRateLimit("mutation", "sari")).toBeUndefined();
});
test("lonjakan mutasi dibatasi dan akun lain tidak ikut diblokir", async () => {
  const service = await limiter({});
  const results = await Promise.all(
    Array.from({ length: 100 }, () =>
      service
        .enforceRateLimit("mutation", "budi")
        .then(() => 200)
        .catch((e) => e.status),
    ),
  );
  expect(results.filter((status) => status === 200)).toHaveLength(30);
  expect(results.filter((status) => status === 429)).toHaveLength(70);
  expect(await service.enforceRateLimit("mutation", "sari")).toBeUndefined();
});
