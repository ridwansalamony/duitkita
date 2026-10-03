"use client";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
// Only public pages are measured. Never send family names, IDs, invite codes,
// transaction routes, or query parameters to analytics.
const safePaths = new Set(["/", "/fitur", "/tentang", "/kontak"]);
export function Telemetry() {
  return (
    <>
      <Analytics
        beforeSend={(event) => {
          const url = new URL(event.url);
          if (!safePaths.has(url.pathname)) return null;
          return { ...event, url: url.origin + url.pathname };
        }}
      />
      <SpeedInsights
        beforeSend={(event) => {
          const url = new URL(event.url);
          if (!safePaths.has(url.pathname)) return null;
          return { ...event, url: url.origin + url.pathname };
        }}
      />
    </>
  );
}
