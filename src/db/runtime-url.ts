// Shared Supabase session pooling pins a backend connection per serverless instance.
// Runtime uses transaction pooling; migration scripts continue to use DIRECT_URL.
export function runtimeDatabaseUrl(value: string) {
  const url = new URL(value);
  if (url.hostname.endsWith(".pooler.supabase.com") && url.port === "5432") {
    url.port = "6543";
    return url.toString();
  }
  return value;
}
