// Demo harus dipilih secara eksplisit; kegagalan koneksi tidak membuka data demo.
export const isDemo = process.env.NEXT_PUBLIC_APP_MODE === "demo";
export function today() {
  return isDemo
    ? "2026-09-30"
    : new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
        new Date(),
      );
}
export function daysAgo(count: number) {
  const d = new Date(today() + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - count);
  return d.toISOString().slice(0, 10);
}
export function monthStart() {
  return today().slice(0, 7) + "-01";
}
