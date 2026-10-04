// Online-only: never cache account pages, API responses, receipts or transactions.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate")
    return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          `<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#7547f5"><title>Koneksi terputus — DuitKita</title><style>body{font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#f8f9fc;color:#1c1c22}main{max-width:360px;padding:32px;text-align:center}h1{font-size:24px}p{line-height:1.6}a{display:inline-block;padding:12px 24px;border-radius:12px;background:#7547f5;color:white;text-decoration:none}</style><main><h1>Koneksi sedang terputus</h1><p>Sambungkan kembali internet untuk membuka ruang keuangan keluarga Anda.</p><a href="">Coba lagi</a></main></html>`,
          {
            status: 503,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-store",
              "Content-Security-Policy":
                "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
            },
          },
        ),
    ),
  );
});
