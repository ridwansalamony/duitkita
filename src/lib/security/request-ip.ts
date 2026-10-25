import { isIP } from "node:net";

// Never treat client-supplied X-Forwarded-For as authoritative. A VPS proxy needs
// an explicitly reviewed trust boundary before its forwarding headers are used.
export function trustedRequestIp(
  headers: { get: (name: string) => string | null },
  vercel = process.env.VERCEL === "1",
) {
  const value = vercel
    ? headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    : undefined;
  return value && isIP(value) ? value : undefined;
}
