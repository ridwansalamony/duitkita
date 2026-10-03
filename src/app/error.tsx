"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="eyebrow text-primary">DuitKita</p>
      <h1 className="text-2xl font-bold">Ada kendala saat membuka halaman.</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        Coba muat ulang bagian ini setelah koneksi pulih. Jika Anda baru saja
        menyimpan catatan, periksa riwayat sebelum mengulangi pengiriman.
      </p>
      <button
        onClick={reset}
        className="gradient-button rounded-xl px-5 py-3 text-sm font-semibold"
      >
        Coba Lagi
      </button>
    </main>
  );
}
