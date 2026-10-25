import { getImageProps } from "next/image";
import { ProductPicture } from "./product-picture";
import { isDemo } from "@/lib/mode";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ShieldCheck,
  ArrowDownLeft,
  Quote,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FeatureIcon } from "./feature-icon";
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

function ProductScreenshot({
  kind,
  priority = false,
}: {
  kind: "dashboard" | "tabungan" | "transaksi";
  priority?: boolean;
}) {
  const description = {
    dashboard:
      "Dasbor DuitKita dengan ringkasan keuangan keluarga demo Budi dan Sari",
    tabungan:
      "Target tabungan keluarga demo Budi dan Sari yang terhubung ke dompet bersama",
    transaksi:
      "Catatan transaksi keluarga demo Budi dan Sari dengan kategori dan nominal rupiah",
  }[kind];
  const common = {
    alt: description,
    width: 1200,
    height: 900,
    sizes: "(max-width: 1023px) 92vw, 600px",
    loading: priority ? ("eager" as const) : ("lazy" as const),
    fetchPriority: priority ? ("high" as const) : ("low" as const),
    decoding: priority ? ("sync" as const) : ("async" as const),
  };
  const { props: light } = getImageProps({
    ...common,
    src: `/produk/${kind}-terang.png`,
  });
  const { props: dark } = getImageProps({
    ...common,
    src: `/produk/${kind}-gelap.png`,
  });
  return (
    <>
      {priority && (
        <>
          <link
            rel="preload"
            as="image"
            imageSrcSet={light.srcSet}
            imageSizes={light.sizes}
            media="(prefers-color-scheme: light)"
            fetchPriority="high"
          />
          <link
            rel="preload"
            as="image"
            imageSrcSet={dark.srcSet}
            imageSizes={dark.sizes}
            media="(prefers-color-scheme: dark)"
            fetchPriority="high"
          />
        </>
      )}
      <div className="product-screenshot overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_36px_-24px_rgba(91,50,169,.3)]">
        <ProductPicture light={light} darkSrcSet={dark.srcSet} />
      </div>
    </>
  );
}
export function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
      <div className="grid items-center gap-8 rounded-2xl border border-primary/15 bg-secondary/60 p-7 md:grid-cols-[1fr_auto] md:p-12">
        <div>
          <h2 className="max-w-xl text-3xl font-bold leading-tight md:text-4xl">
            Rencana besar dimulai dari catatan kecil.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
            Bangun kebiasaan keuangan yang sehat. Satu catatan, satu percakapan,
            satu langkah bersama.
          </p>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            Catat transaksi tanpa menghubungkan rekening bank.
          </p>
        </div>
        <Button asChild className="gradient-button h-12 w-fit rounded-xl px-6">
          <Link prefetch={false} href="/daftar">
            Mulai Bersama <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </section>
  );
}
export function Landing() {
  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 md:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:py-16">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">
            Keuangan sehat, hubungan hangat
          </p>
          <h1 className="mt-5 max-w-2xl text-[38px] font-extrabold leading-[1.15] tracking-[-.045em] sm:text-5xl lg:text-[42px] xl:text-[46px]">
            Uang berdua. Cerita bersama.{" "}
            <span className="text-primary">Lebih tenang.</span>
          </h1>
          <p className="mt-6 max-w-[49ch] text-base leading-7 text-muted-foreground">
            Kenali keuangan keluarga tanpa perlu saling menebak. Catat
            pengeluaran, bagi rencana, dan wujudkan impian bersama pasangan.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild className="gradient-button h-12 rounded-xl px-6">
              <Link prefetch={false} href="/daftar">
                Mulai Bersama <ArrowUpRight size={17} />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-xl px-5">
              <Link prefetch={false} href="/dashboard">
                {isDemo ? "Lihat Demo" : "Buka Dasbor"} <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
        <div className="min-w-0">
          <ProductScreenshot kind="dashboard" priority />
        </div>
      </section>
      <section className="border-y bg-canvas">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-x-8 gap-y-4 px-5 py-6 text-xs leading-6 text-muted-foreground md:px-8">
          <p className="flex items-center gap-2">
            <Check size={16} className="shrink-0 text-primary" />
            Rupiah &amp; bahasa Indonesia
          </p>
          <p className="flex items-center gap-2">
            <ShieldCheck size={16} className="shrink-0 text-primary" />
            Ruang khusus keluarga
          </p>
          <p>Catat tanpa ribet. Pahami bersama. Wujudkan impian.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">
            Bukan sekadar angka. Ini tentang kita.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
            Semua yang Anda butuhkan untuk mengelola uang bersama, dalam satu
            ruang yang nyaman.
          </p>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border bg-secondary/50 p-7 md:p-8">
            <FeatureIcon name={features[0].icon} />
            <h3 className="mt-5 text-xl font-bold">{features[0].title}</h3>
            <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
              {features[0].text}
            </p>
            <Link
              prefetch={false}
              href="/fitur"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Fitur <ArrowRight size={16} />
            </Link>
          </article>
          <article className="rounded-2xl border p-7 md:p-8">
            <FeatureIcon name={features[1].icon} />
            <h3 className="mt-5 text-xl font-bold">{features[1].title}</h3>
            <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
              {features[1].text}
            </p>
            <Link
              prefetch={false}
              href="/fitur"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Fitur <ArrowRight size={16} />
            </Link>
          </article>
          <article className="grid min-w-0 gap-8 rounded-2xl border bg-canvas p-7 md:col-span-2 md:grid-cols-[.8fr_1.2fr] md:items-center md:p-8">
            <div>
              <FeatureIcon name={features[2].icon} />
              <h3 className="mt-5 text-2xl font-bold">{features[2].title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {features[2].text}
              </p>
              <Link
                prefetch={false}
                href="/fitur"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
              >
                Fitur <ArrowRight size={16} />
              </Link>
            </div>
            <div className="min-w-0">
              <ProductScreenshot kind="tabungan" />
            </div>
          </article>
        </div>
      </section>
      <section className="border-y bg-secondary/30">
        <div className="mx-auto max-w-4xl px-5 py-14 md:px-8 md:py-16">
          <h2 className="text-2xl font-bold leading-tight md:text-3xl">
            Obrolan soal uang, jadi lebih ringan.
          </h2>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            Ilustrasi pengalaman dari keluarga demo.
          </p>
          <figure className="mt-7">
            <Quote className="text-primary" size={28} />
            <blockquote className="mt-4 max-w-3xl font-heading text-base font-medium leading-7 md:text-lg">
              “Sekarang tinggal lihat bareng.”
            </blockquote>
            <figcaption className="mt-5 text-sm font-semibold">
              Budi &amp; Sari{" "}
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                Keluarga demo · Satu tujuan, berdua
              </span>
            </figcaption>
          </figure>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-5 py-16 md:py-20">
        <h2 className="text-3xl font-bold">Mungkin Anda juga penasaran.</h2>
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
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-primary">
            Ruang untuk semua rencana
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Keuangan keluarga, terasa lebih sederhana.
          </h1>
          <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
            Dari belanja sayur sampai dana rumah pertama, setiap langkah punya
            tempat di DuitKita.
          </p>
        </div>
        <div className="mt-12 grid gap-x-12 md:grid-cols-2">
          {features.map((f) => (
            <article key={f.title} className="flex gap-4 border-t py-7">
              <FeatureIcon name={f.icon} />
              <div className="min-w-0">
                <h2 className="text-lg font-bold">{f.title}</h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                  {f.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="border-y bg-canvas">
        <div className="mx-auto grid max-w-7xl items-center gap-9 px-5 py-14 md:grid-cols-[.75fr_1.25fr] md:px-8 md:py-16">
          <div>
            <h2 className="text-3xl font-bold">Lihat seperti apa rasanya.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {isDemo
                ? "Jelajahi transaksi, dompet, laporan, dan target tabungan dengan data contoh Budi & Sari. Perubahan demo hanya berlaku selama sesi."
                : "Catat transaksi, baca struk, pantau anggaran, dan unduh laporan keuangan keluarga dari dasbor Anda."}
            </p>
            <Button asChild variant="outline" className="mt-6 h-11">
              <Link prefetch={false} href="/dashboard">
                {isDemo ? "Lihat Demo" : "Buka Dasbor"}
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
          <div className="min-w-0">
            <ProductScreenshot kind="transaksi" />
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
export function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-20">
        <p className="text-sm font-semibold text-primary">Cerita DuitKita</p>
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
          <div className="min-w-0 rounded-2xl bg-secondary p-6 md:p-8">
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
            <div className="mt-6">
              <ProductScreenshot kind="dashboard" />
            </div>
          </div>
        </div>
        <div className="mt-14 divide-y border-y">
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
            <div
              key={title}
              className="grid gap-4 py-7 sm:grid-cols-[32px_1fr_1.5fr] sm:items-start sm:gap-6"
            >
              <ArrowDownLeft className="text-primary" />
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <ProductScreenshot kind="tabungan" />
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
