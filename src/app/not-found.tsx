import Link from "next/link";
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      <span className="eyebrow">DuitKita · 404</span>
      <h1 className="text-3xl font-bold">Sepertinya salah jalan.</h1>
      <p className="text-muted-foreground">
        Halaman ini tidak ditemukan. Mari kembali ke ruang keluarga.
      </p>
      <Link
        className="rounded-xl bg-primary px-5 py-3 text-primary-foreground"
        href="/dashboard"
      >
        Kembali ke dasbor
      </Link>
    </main>
  );
}
