import { isDemo } from "@/lib/mode";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ShieldCheck,
  Heart,
  Sparkles,
  Wallet,
  ArrowDownLeft,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FeatureIcon, Reveal } from "@/components/shared/common";
export const features = [
  {
    icon: "wallet",
    title: "Satu cerita keuangan",
    text: "Pemasukan, pengeluaran, dan transfer tersusun rapi. Anda dan pasangan selalu punya gambaran yang sama.",
    color: "#7c3aed",
  },
  {
    icon: "shopping-bag",
    title: "Struk jadi catatan",
    text: "Foto struk belanja, tinjau nominal dan tanggal, lalu simpan. Lebih sedikit mengetik, lebih banyak waktu berdua.",
    color: "#f59e0b",
  },
  {
    icon: "home",
    title: "Impian punya rencana",
    text: "Dari liburan singkat sampai rumah pertama. Hubungkan dompet, lalu lihat transfer tabungan membawa Anda selangkah lebih dekat.",
    color: "#0d9488",
  },
  {
    icon: "heart",
    title: "Satu keluarga, dompet bersama",
    text: "Atur dompet keluarga, liburan, dan dana darurat. Semua saldo dan transaksi terlihat oleh Anda berdua.",
    color: "#f43f5e",
  },
  {
    icon: "tag",
    title: "Setiap rupiah terlihat",
    text: "Kenali kebiasaan belanja melalui laporan harian hingga bulanan, dengan rincian kategori dan anggota.",
    color: "#3b82f6",
  },
  {
    icon: "briefcase",
    title: "Transparan sejak awal",
    text: "Riwayat aktivitas membantu Anda memahami siapa yang mencatat dan apa yang berubah.",
    color: "#8b5cf6",
  },
];
export function MiniDashboard() {
  return (
    <div className="relative mx-auto w-full max-w-[510px] py-8">
      <div className="absolute -inset-4 -z-10 rounded-full bg-secondary/70 blur-2xl" />
      <div className="rotate-[-3deg] rounded-[24px] border border-white/70 bg-card p-5 shadow-[0_24px_80px_-24px_rgba(91,50,169,.3)] sm:p-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-white">
              <Wallet size={15} />
            </span>
            Ruang Budi & Sari
          </div>
          <span className="rounded-full bg-success-surface px-2 py-1 text-[10px] font-medium text-success">
            Bertumbuh bersama
          </span>
        </div>
        <div className="mt-6 rounded-2xl bg-[#6c3de9] p-6 text-white">
          <span className="text-xs text-white/75">Saldo keluarga</span>
          <p className="number mt-2 text-3xl font-semibold sm:text-4xl">
            Rp 23.852.500
          </p>
          <div className="mt-5 flex gap-8 text-xs">
            <div>
              <p className="text-white/65">Pemasukan bulan ini</p>
              <p className="mt-1 font-medium">↙ Rp 18.000.000</p>
            </div>
            <div>
              <p className="text-white/65">Uang untuk impian</p>
              <p className="mt-1 font-medium">Rp 61.250.000</p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs font-semibold">Cerita hari ini</p>
          <span className="text-[10px] text-muted-foreground">
            30 September
          </span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <FeatureIcon
            name="utensils"
            color="#f59e0b"
            className="size-9 rounded-xl"
          />
          <div className="flex-1">
            <p className="text-xs font-medium">Makan malam berdua</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Budi · Makan & Minum
            </p>
          </div>
          <p className="text-xs font-semibold">−Rp 87.500</p>
        </div>
        <div className="mt-4 flex items-center gap-3 border-t pt-4">
          <FeatureIcon
            name="heart"
            color="#0d9488"
            className="size-9 rounded-xl"
          />
          <div className="flex-1">
            <p className="text-xs font-medium">Berbagi untuk sesama</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Sari · Zakat & Donasi
            </p>
          </div>
          <p className="text-xs font-semibold">−Rp 100.000</p>
        </div>
      </div>
      <div className="absolute -bottom-3 right-0 flex rotate-[3deg] items-center gap-3 rounded-2xl border bg-card p-4 shadow-xl sm:-right-4">
        <span className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Sparkles size={23} />
        </span>
        <div>
          <p className="text-xs font-semibold">Rumah impian makin dekat!</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Rp42,5 juta dari Rp150 juta terkumpul
          </p>
          <div className="mt-2 h-1.5 w-44 rounded-full bg-muted">
            <div className="h-full w-[28%] rounded-full bg-amber-400" />
          </div>
        </div>
      </div>
      <div className="absolute -left-3 top-0 flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-[11px] font-medium shadow-md">
        <span className="flex -space-x-1.5">
          <span className="flex size-6 items-center justify-center rounded-full border-2 border-card bg-orange-100 text-orange-800">
            B
          </span>
          <span className="flex size-6 items-center justify-center rounded-full border-2 border-card bg-purple-100 text-purple-800">
            S
          </span>
        </span>
        Lebih tenang, bareng pasangan{" "}
        <Heart size={12} className="text-primary" />
      </div>
    </div>
  );
}
export function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <div className="relative overflow-hidden rounded-[28px] bg-[#20123b] px-6 py-14 text-center text-white">
        <div className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full border-[45px] border-white/5" />
        <span className="text-xs font-medium uppercase tracking-[.2em] text-purple-300">
          Mulai cerita yang lebih baik
        </span>
        <h2 className="relative mt-4 text-3xl font-bold md:text-4xl">
          Rencana besar dimulai
          <br />
          dari catatan kecil.
        </h2>
        <p className="relative mx-auto mt-4 max-w-md text-sm leading-6 text-purple-200/80">
          Bangun kebiasaan keuangan yang sehat. Satu catatan, satu percakapan,
          satu langkah bersama.
        </p>
        <Button
          asChild
          className="relative mt-7 h-12 rounded-xl bg-white px-6 text-[#40217c] hover:bg-purple-100"
        >
          <Link href="/daftar">
            Mulai Bersama <ArrowRight size={16} />
          </Link>
        </Button>
        <p className="mt-4 text-[11px] text-purple-300/75">
          Catat transaksi tanpa menghubungkan rekening bank.
        </p>
      </div>
    </section>
  );
}
export function Landing() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 -z-10 h-full w-2/3 bg-[radial-gradient(ellipse_at_center,var(--secondary),transparent_70%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 md:px-8 lg:grid-cols-2 lg:gap-20 lg:py-24">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-secondary/70 px-3 py-1.5 text-[11px] font-medium text-primary">
              <Heart size={13} /> Keuangan sehat, hubungan hangat
            </span>
            <h1 className="mt-6 text-[42px] font-extrabold leading-[1.17] tracking-[-.055em] sm:text-5xl lg:text-[60px]">
              Uang berdua.
              <br />
              Cerita bersama.
              <br />
              <span className="text-primary">Lebih tenang.</span>
            </h1>
            <p className="mt-6 max-w-[450px] text-base leading-7 text-muted-foreground">
              Kenali keuangan keluarga tanpa perlu saling menebak. Catat
              pengeluaran, bagi rencana, dan wujudkan impian bersama pasangan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="gradient-button h-12 rounded-xl px-6">
                <Link href="/daftar">
                  Mulai Bersama <ArrowUpRight size={17} />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-xl px-6"
              >
                <Link href="/dashboard">
                  {isDemo ? "Lihat Demo" : "Buka Dasbor"}{" "}
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check size={13} className="text-success" />
                Rupiah & bahasa Indonesia
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-success" />
                Ruang khusus keluarga
              </span>
            </div>
          </Reveal>
          <Reveal className="px-2 pb-5">
            <MiniDashboard />
          </Reveal>
        </div>
      </section>
      <section className="border-y bg-canvas">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-5 py-7 text-center sm:grid-cols-3">
          {[
            ["01", "Catat tanpa ribet"],
            ["02", "Pahami bersama"],
            ["03", "Wujudkan impian"],
          ].map(([n, title]) => (
            <div key={n} className="flex items-center justify-center gap-3">
              <span className="font-heading text-xs font-bold text-primary/60">
                {n}
              </span>
              <p className="font-heading text-sm font-semibold">{title}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow text-primary">Sederhana, tapi berarti</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Bukan sekadar angka.
              <br />
              Ini tentang kita.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Semua yang Anda butuhkan untuk mengelola uang bersama, dalam satu
            ruang yang nyaman.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {features.slice(0, 3).map((f) => (
            <div
              key={f.title}
              className="panel transition-shadow hover:shadow-md"
            >
              <FeatureIcon name={f.icon} color={f.color} />
              <h3 className="mt-6 text-lg font-bold">{f.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {f.text}
              </p>
              <Link
                href="/fitur"
                className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-primary"
              >
                Kenali lebih dekat <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-secondary/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[.8fr_1.2fr] md:px-8">
          <div>
            <p className="eyebrow text-primary">Cerita keluarga</p>
            <h2 className="mt-3 text-3xl font-bold">
              Obrolan soal uang,
              <br />
              jadi lebih ringan.
            </h2>
            <p className="mt-4 text-xs text-muted-foreground">
              Ilustrasi pengalaman dari keluarga demo.
            </p>
          </div>
          <div className="panel">
            <Quote className="text-primary/40" size={30} />
            <blockquote className="mt-4 font-heading text-lg font-medium leading-8">
              “Dulu sering tanya, uang belanja tinggal berapa? Sekarang tinggal
              lihat bareng. Kami jadi lebih semangat menabung untuk rumah
              pertama.”
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                BS
              </span>
              <div>
                <p className="text-sm font-semibold">Budi & Sari</p>
                <p className="text-xs text-muted-foreground">
                  Keluarga demo · Satu tujuan, berdua
                </p>
              </div>
              <Heart className="ml-auto text-primary" size={20} />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-5 py-20">
        <p className="eyebrow text-center text-primary">Biar makin kenal</p>
        <h2 className="mt-3 text-center text-3xl font-bold">
          Mungkin Anda juga penasaran.
        </h2>
        <FAQ />
      </section>
      <CTA />
    </>
  );
}
export function FAQ() {
  return (
    <Accordion type="single" collapsible className="mt-8">
      {[
        [
          "Apakah saya harus menghubungkan rekening bank?",
          "Tidak. Anda mencatat transaksi sendiri, sehingga Anda tetap memegang kendali atas informasi yang dibagikan.",
        ],
        [
          "Apakah semua dompet bisa dilihat pasangan?",
          "Ya. Semua dompet menjadi milik bersama dalam satu keluarga. Data tetap terpisah dari keluarga lain.",
        ],
        [
          isDemo
            ? "Bisakah kami mencoba sebelum membuat akun?"
            : "Bagaimana cara memulai?",
          isDemo
            ? "Tentu. Pilih Lihat Demo untuk menjelajahi ruang Keluarga Budi & Sari. Perubahan demo hanya berlaku selama sesi dan akan direset saat halaman dimuat ulang."
            : "Daftar dengan email, verifikasi akun, lalu buat keluarga atau bergabung menggunakan kode dari pasangan Anda.",
        ],
        [
          "Bagaimana cara mengundang pasangan?",
          "Pemilik keluarga membagikan kode undangan dari Pengaturan. Pasangan memilih Gabung Keluarga dan memasukkan kode tersebut. Kode berlaku selama tujuh hari.",
        ],
      ].map(([q, a], i) => (
        <AccordionItem key={q} value={String(i)}>
          <AccordionTrigger className="py-5 text-left text-sm">
            {q}
          </AccordionTrigger>
          <AccordionContent className="leading-6 text-muted-foreground">
            {a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
export function FeaturesPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow text-primary">
            Ruang untuk semua rencana
          </span>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            Keuangan keluarga,
            <br />
            terasa lebih sederhana.
          </h1>
          <p className="mt-5 leading-7 text-muted-foreground">
            Dari belanja sayur sampai dana rumah pertama, setiap langkah punya
            tempat di DuitKita.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <article key={f.title} className="panel">
              <div className="flex items-center justify-between">
                <FeatureIcon name={f.icon} color={f.color} />
                <span className="eyebrow">0{i + 1}</span>
              </div>
              <h2 className="mt-6 text-xl font-bold">{f.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {f.text}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-2xl border bg-secondary/40 p-6">
          <div>
            <h2 className="font-bold">Lihat seperti apa rasanya.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Demo menampilkan seluruh halaman. OCR, autentikasi, dan ekspor
              akan terhubung pada fase berikutnya.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              {isDemo ? "Buka demo" : "Buka Dasbor"} <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </div>
      <CTA />
    </>
  );
}
export function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-5 py-16 md:px-8">
        <p className="eyebrow text-primary">Cerita DuitKita</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
          Karena masa depan
          <br />
          lebih indah direncanakan berdua.
        </h1>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div className="space-y-5 text-base leading-8 text-muted-foreground">
            <p>
              Urusan uang sering dimulai dari pertanyaan kecil: “Tadi belanja
              berapa?” atau “Bulan ini bisa menabung berapa?” Ketika catatan
              tersebar, jawaban sederhana pun bisa terasa rumit.
            </p>
            <p>
              DuitKita dirancang sebagai ruang bersama untuk percakapan itu.
              Bukan untuk saling mengawasi, melainkan saling memahami dan
              menyepakati langkah berikutnya.
            </p>
          </div>
          <div className="rounded-[24px] bg-secondary p-8">
            <Heart className="text-primary" size={36} />
            <h2 className="mt-6 text-2xl font-bold">
              Uang berdua,
              <br />
              tercatat berdua.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Kami percaya rencana bersama tumbuh dari catatan yang terbuka.
              Setiap keluarga punya ritme, prioritas, dan cara bertumbuhnya
              sendiri.
            </p>
          </div>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {[
            [
              "Saling terbuka",
              "Informasi yang jelas membuat percakapan lebih tenang.",
            ],
            [
              "Saling percaya",
              "Semua dompet dapat dikelola bersama dalam satu keluarga.",
            ],
            [
              "Saling mendukung",
              "Setiap tabungan, besar atau kecil, membawa arti.",
            ],
          ].map(([title, text]) => (
            <div key={title} className="panel">
              <ArrowDownLeft className="text-primary" />
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {text}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-16">
          <h2 className="text-2xl font-bold">
            Pertanyaan yang sering ditanyakan
          </h2>
          <FAQ />
        </div>
        <div id="privasi" className="mt-14 scroll-mt-24 rounded-2xl border p-6">
          <h2 className="font-bold">
            {isDemo ? "Privasi & ketentuan demo" : "Tentang data Anda"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {isDemo
              ? "Versi demo memakai data contoh. Form masuk, kontak, dan undangan tidak mengirim data ke layanan eksternal. Perubahan hanya tersimpan selama sesi browser."
              : "Akun dan catatan keluarga disimpan melalui Supabase. Semua dompet dan transaksi dapat dilihat anggota keluarga yang sama. Unggah struk bersifat opsional; pembacaan otomatis memakai Tesseract.js di perangkat Anda untuk memberi saran isian yang perlu Anda periksa kembali."}
          </p>
        </div>
      </section>
      <CTA />
    </>
  );
}
