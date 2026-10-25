import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { trustedRequestIp } from "./request-ip";

const policies = {
  login: { limit: 20, seconds: 900 },
  register: { limit: 5, seconds: 3600 },
  recovery: { limit: 5, seconds: 3600 },
  password: { limit: 5, seconds: 900 },
  family: { limit: 10, seconds: 3600 },
  receipt: { limit: 20, seconds: 60 },
  report: { limit: 60, seconds: 60 },
  mutation: { limit: 30, seconds: 60 },
  workspace: { limit: 30, seconds: 60 },
  realtime: { limit: 12, seconds: 60 },
} as const;
export type RateLimitKind = keyof typeof policies;
type Kind = RateLimitKind;
const buckets = new Map<string, { count: number; reset: number }>();
let nextCleanup = 0;
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
export async function enforceRateLimit(kind: Kind, identity?: string) {
  const h = await headers();
  // Vercel overwrites this header. Other deployments use one shared bucket unless
  // an authenticated identity is provided; untrusted forwarded headers are ignored.
  const source = identity || trustedRequestIp(h) || "local-or-unidentified";
  const key = createHash("sha256").update(source).digest("hex");
  const { limit, seconds } = policies[kind];
  // Best-effort per-instance limit; counters reset on restart and are not shared.
  const now = Date.now();
  // Bounded cleanup once a minute; do not scan every account on each request.
  if (now >= nextCleanup || buckets.size >= 10000) {
    for (const [id, bucket] of buckets)
      if (bucket.reset <= now) buckets.delete(id);
    nextCleanup = now + 60000;
  }
  const id = `${kind}:${key}`;
  const existing = buckets.get(id);
  const bucket =
    existing && existing.reset > now
      ? existing
      : { count: 0, reset: now + seconds * 1000 };
  if (bucket.count >= limit || (!existing && buckets.size >= 10000))
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
