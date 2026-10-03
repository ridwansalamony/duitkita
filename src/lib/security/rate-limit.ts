import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const policies = {
  login: { limit: 20, seconds: 900 },
  register: { limit: 5, seconds: 3600 },
  recovery: { limit: 5, seconds: 3600 },
  password: { limit: 5, seconds: 900 },
  family: { limit: 10, seconds: 3600 },
  receipt: { limit: 20, seconds: 60 },
  report: { limit: 60, seconds: 60 },
} as const;
type Kind = keyof typeof policies;
const buckets = new Map<string, { count: number; reset: number }>();
const limiters = new Map<Kind, Ratelimit>();
export class RateLimitError extends Error {
  constructor(
    public status = 429,
    public retryAfter = 60,
  ) {
    super(
      status === 429
        ? "Terlalu banyak percobaan. Tunggu beberapa saat lalu coba kembali."
        : "Layanan sementara belum tersedia. Coba beberapa saat lagi.",
    );
  }
}
function requiresDistributedLimit() {
  const hostname = new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ).hostname;
  return (
    process.env.VERCEL === "1" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(hostname)
  );
}
export async function enforceRateLimit(kind: Kind, identity?: string) {
  const h = await headers();
  // Vercel overwrites this header. Other deployments use one shared bucket unless
  // an authenticated identity is provided; untrusted forwarded headers are ignored.
  const source =
    identity ||
    (process.env.VERCEL === "1"
      ? h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
      : null) ||
    "local-or-unidentified";
  const key = createHash("sha256").update(source).digest("hex");
  const { limit, seconds } = policies[kind];
  const url = process.env.UPSTASH_REDIS_REST_URL,
    token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    let limiter = limiters.get(kind);
    if (!limiter) {
      limiter = new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(limit, `${seconds} s`),
        prefix: `duitkita:${kind}`,
        analytics: false,
        timeout: 2000,
      });
      limiters.set(kind, limiter);
    }
    try {
      const result = await limiter.limit(key);
      await result.pending;
      if (result.reason === "timeout") throw new RateLimitError(503);
      if (!result.success)
        throw new RateLimitError(
          429,
          Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
        );
      return;
    } catch (error) {
      throw error instanceof RateLimitError ? error : new RateLimitError(503);
    }
  }
  if (requiresDistributedLimit()) throw new RateLimitError(503);
  // Local development only; never claim this is shared across production instances.
  const now = Date.now();
  for (const [id, bucket] of buckets)
    if (bucket.reset <= now) buckets.delete(id);
  const id = `${kind}:${key}`;
  const bucket = buckets.get(id) ?? { count: 0, reset: now + seconds * 1000 };
  if (bucket.count >= limit || buckets.size >= 10000)
    throw new RateLimitError(
      429,
      Math.max(1, Math.ceil((bucket.reset - now) / 1000)),
    );
  bucket.count++;
  buckets.set(id, bucket);
}
export async function checkAuthRate(
  kind: Exclude<Kind, "receipt" | "report">,
  account?: string,
) {
  try {
    await enforceRateLimit(kind);
    if (account)
      await enforceRateLimit(kind, `account:${account.trim().toLowerCase()}`);
    return null;
  } catch (error) {
    return {
      error:
        error instanceof RateLimitError
          ? error.message
          : "Permintaan belum dapat diproses.",
    };
  }
}
