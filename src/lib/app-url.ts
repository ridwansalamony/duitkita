type AppEnvironment = {
  NEXT_PUBLIC_APP_URL?: string;
  VERCEL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
};

export function appUrl(
  env: AppEnvironment = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    VERCEL: process.env.VERCEL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  },
): string {
  const configured = env.NEXT_PUBLIC_APP_URL?.trim();
  const hosted = env.VERCEL === "1";
  if (configured) {
    try {
      const url = new URL(configured);
      const local =
        /^(localhost|.*\.localhost|127\..*|0\.0\.0\.0|\[::1\])$/.test(
          url.hostname,
        );
      if (
        !url.username &&
        !url.password &&
        ["https:", "http:"].includes(url.protocol) &&
        (!hosted || (url.protocol === "https:" && !local))
      )
        return url.origin;
    } catch {
      /* Fall back only to trusted deployment configuration. */
    }
  }
  if (hosted) {
    const domain = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (domain && /^[a-z0-9.-]+$/i.test(domain)) {
      const url = new URL(`https://${domain}`);
      if (!/^(localhost|.*\.localhost|127\..*|0\.0\.0\.0)$/.test(url.hostname))
        return url.origin;
    }
    throw new Error("Konfigurasi URL production belum tersedia.");
  }
  if (configured) throw new Error("Konfigurasi URL aplikasi tidak valid.");
  return "http://localhost:3000";
}
