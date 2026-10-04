"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Mail,
  Eye,
  EyeOff,
  Heart,
  Home,
  Users,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { RequestForm } from "@/components/ui/request-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DemoNote, FeatureIcon } from "@/components/shared/common";
import { useDemo } from "@/lib/dummy/store";
import { isDemo } from "@/lib/mode";
import { login, register, resetPassword, onboarding } from "@/actions/auth";
export function AuthForm({ mode }: { mode: "login" | "register" | "reset" }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const heading =
    mode === "login"
      ? "Senang Anda kembali."
      : mode === "register"
        ? "Mulai cerita keuangan Anda."
        : "Mari pulihkan akses Anda.";
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const f = new FormData(event.currentTarget);
    if (!isDemo) {
      setPending(true);
      try {
        const invitation = new URLSearchParams(window.location.search).get(
          "next",
        );
        if (invitation && /^\/undang\/[A-Za-z0-9-]{1,12}$/.test(invitation))
          f.set("next", invitation);
        const result =
          mode === "login"
            ? await login(Object.fromEntries(f))
            : mode === "register"
              ? await register(Object.fromEntries(f))
              : await resetPassword(f.get("email"));
        if (result.error) {
          setError(result.error);
          return;
        }
        if (
          mode === "reset" ||
          (mode === "register" && !("confirmed" in result && result.confirmed))
        ) {
          setSent(true);
          return;
        }
        const next = new URLSearchParams(window.location.search).get("next");
        router.push(
          next?.startsWith("/undang/")
            ? next
            : mode === "login"
              ? "/dashboard"
              : "/pengaturan-awal",
        );
        router.refresh();
      } catch {
        setError(
          "Layanan belum terhubung. Periksa konfigurasi atau coba beberapa saat lagi.",
        );
      } finally {
        setPending(false);
      }
      return;
    }
    if (mode === "register" && f.get("password") !== f.get("confirm")) {
      setError("Konfirmasi kata sandi belum sama. Coba periksa kembali.");
      return;
    }
    if (mode === "reset") {
      setSent(true);
      return;
    }
    toast.success(
      mode === "login"
        ? "Selamat datang di ruang demo Budi & Sari"
        : "Pendaftaran dicoba. Lanjutkan ke pengaturan keluarga demo.",
    );
    router.push(mode === "login" ? "/dashboard" : "/pengaturan-awal");
  }
  return (
    <div className="mx-auto grid min-h-180 max-w-6xl items-center gap-12 px-5 py-12 md:grid-cols-2 md:px-8">
      <div className="hidden rounded-[28px] bg-[#261441] p-12 text-white md:block">
        <span className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs text-purple-200">
          Satu keluarga. Satu ruang.
        </span>
        <h2 className="mt-8 text-4xl font-bold leading-tight">
          Lebih terbuka.
          <br />
          Lebih kompak.
          <br />
          <span className="text-purple-300">Lebih tenang.</span>
        </h2>
        <p className="mt-6 text-sm leading-7 text-purple-200/75">
          Setiap rupiah punya cerita. Mulai catat cerita keluarga Anda, bersama
          pasangan.
        </p>
        <div className="my-10 flex items-center justify-center gap-5">
          <span className="flex size-20 items-center justify-center rounded-full bg-orange-100 text-2xl font-bold text-orange-800">
            B
          </span>
          <Heart className="text-purple-300" />
          <span className="flex size-20 items-center justify-center rounded-full bg-purple-200 text-2xl font-bold text-purple-800">
            S
          </span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm leading-6">
            “Catatan kecil setiap hari membuat impian kami terasa lebih dekat.”
          </p>
          <p className="mt-3 text-xs text-purple-300">
            Budi & Sari · Keluarga demo
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md">
        <span className="eyebrow text-primary">
          {mode === "login"
            ? "Masuk ke DuitKita"
            : mode === "register"
              ? "Daftar DuitKita"
              : "Lupa kata sandi"}
        </span>
        <h1 className="mt-3 text-3xl font-bold">{heading}</h1>
        <p className="mb-6 mt-3 text-sm leading-6 text-muted-foreground">
          {mode === "reset"
            ? "Masukkan email Anda untuk menerima tautan pemulihan akun."
            : "Ruang yang nyaman untuk mengatur uang dan merencanakan masa depan bersama."}
        </p>
        <DemoNote />
        {sent ? (
          <div className="mt-6 rounded-xl bg-success-surface p-5">
            <Check className="text-success" />
            <h2 className="mt-3 font-semibold">
              {isDemo
                ? "Alur pemulihan berhasil dicoba"
                : "Periksa kotak masuk Anda"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isDemo
                ? "Pada demo ini, email pemulihan tidak dikirim. Anda dapat langsung menjelajahi dasbor."
                : mode === "register"
                  ? "Buka tautan verifikasi email untuk melanjutkan pengaturan keluarga."
                  : "Jika email terdaftar, tautan pemulihan akan dikirim. Periksa juga folder spam."}
            </p>
            <Button asChild className="mt-4">
              <Link href={isDemo ? "/dashboard" : "/masuk"}>
                {isDemo ? "Buka demo" : "Kembali ke Masuk"}
              </Link>
            </Button>
          </div>
        ) : (
          <RequestForm onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <label className="field">
                Nama lengkap
                <Input
                  name="name"
                  autoComplete="name"
                  placeholder="Contoh: Budi Santoso"
                  minLength={2}
                  maxLength={120}
                  required
                />
              </label>
            )}
            <label className="field">
              Alamat email
              <Input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nama@contoh.com"
                required
              />
            </label>
            {mode !== "reset" && (
              <>
                <label className="field">
                  Kata sandi
                  <span className="relative">
                    <Input
                      name="password"
                      type={show ? "text" : "password"}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      placeholder="Minimal 8 karakter, huruf dan angka"
                      minLength={8}
                      pattern={
                        mode === "register"
                          ? "(?=.*[A-Za-z])(?=.*[0-9]).{8,}"
                          : undefined
                      }
                      title="Gunakan minimal 8 karakter, termasuk huruf dan angka"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      aria-label={
                        show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                      }
                      onClick={() => setShow(!show)}
                      className="absolute inset-y-0 right-3 text-muted-foreground"
                    >
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </span>
                </label>
                {mode === "register" && (
                  <label className="field">
                    Konfirmasi kata sandi
                    <Input
                      name="confirm"
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                  </label>
                )}
                {mode === "login" && (
                  <div className="text-right">
                    <Link
                      href="/lupa-kata-sandi"
                      className="text-xs font-medium text-primary"
                    >
                      Lupa kata sandi?
                    </Link>
                  </div>
                )}
              </>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              loading={pending}
              disabled={pending}
              type="submit"
              className="gradient-button h-11 w-full rounded-xl"
            >
              {pending
                ? "Mohon tunggu…"
                : mode === "login"
                  ? "Masuk ke Ruang Kita"
                  : mode === "register"
                    ? isDemo
                      ? "Buat Akun Demo"
                      : "Buat Akun"
                    : isDemo
                      ? "Coba Pemulihan Akun"
                      : "Kirim Tautan Pemulihan"}
              <ArrowRight size={16} />
            </Button>
          </RequestForm>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "register" ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <Link
            onClick={(event) => {
              if (!isDemo) {
                const next = new URLSearchParams(window.location.search).get(
                  "next",
                );
                if (next?.startsWith("/undang/")) {
                  event.preventDefault();
                  router.push(
                    `${mode === "register" ? "/masuk" : "/daftar"}?next=${encodeURIComponent(next)}`,
                  );
                }
              }
            }}
            href={mode === "register" ? "/masuk" : "/daftar"}
            className="font-semibold text-primary"
          >
            {mode === "register" ? "Masuk" : "Mulai bersama"}
          </Link>
        </p>
        {isDemo && (
          <Link
            href="/dashboard"
            className="mt-4 block text-center text-xs text-muted-foreground underline underline-offset-4"
          >
            Langsung jelajahi demo
          </Link>
        )}
      </div>
    </div>
  );
}
export function ContactForm() {
  const [sent, setSent] = useState(false);
  return (
    <section className="mx-auto grid max-w-6xl gap-14 px-5 py-16 md:grid-cols-2 md:px-8">
      <div>
        <p className="eyebrow text-primary">Mari mengobrol</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight">
          Ada cerita atau
          <br />
          ide untuk DuitKita?
        </h1>
        <p className="mt-5 max-w-sm leading-7 text-muted-foreground">
          Masukan Anda membantu kami membuat ruang keuangan yang lebih nyaman
          untuk keluarga.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <FeatureIcon name="heart" />
          <div>
            <p className="text-sm font-semibold">Tim DuitKita</p>
            <p className="mt-1 text-xs text-muted-foreground">
              halo@duitkita.example · alamat contoh
            </p>
          </div>
        </div>
      </div>
      <div className="panel">
        <h2 className="text-xl font-bold">Tulis pesan Anda</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Form demo - pesan tidak dikirim.
        </p>
        {sent ? (
          <div className="mt-8 rounded-xl bg-success-surface p-6">
            <Check className="text-success" />
            <h3 className="mt-3 font-semibold">Terima kasih sudah mencoba!</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Pratinjau pengiriman berhasil. Tidak ada pesan yang dikirim atau
              disimpan di server.
            </p>
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => setSent(false)}
            >
              Tulis pesan lain
            </Button>
          </div>
        ) : (
          <RequestForm
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="mt-6 space-y-5"
          >
            <label className="field">
              Nama Anda
              <Input required name="name" placeholder="Budi Santoso" />
            </label>
            <label className="field">
              Email
              <Input
                required
                name="email"
                type="email"
                placeholder="budi@contoh.com"
              />
            </label>
            <label className="field">
              Topik
              <select name="subject">
                <option>Ide & masukan</option>
                <option>Pertanyaan fitur</option>
                <option>Kendala penggunaan</option>
              </select>
            </label>
            <label className="field">
              Pesan
              <textarea
                required
                name="message"
                rows={5}
                minLength={10}
                placeholder="Ceritakan hal yang ingin Anda sampaikan…"
              />
            </label>
            <Button className="gradient-button w-full" type="submit">
              Coba Kirim Pesan <Mail size={16} />
            </Button>
          </RequestForm>
        )}
      </div>
    </section>
  );
}
export function Onboarding({ invite }: { invite?: string }) {
  return isDemo ? (
    <DemoOnboarding invite={invite} />
  ) : (
    <LiveOnboarding invite={invite} />
  );
}
function LiveOnboarding({ invite }: { invite?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  async function submit(
    e: React.FormEvent<HTMLFormElement>,
    kind: "create" | "join",
  ) {
    e.preventDefault();
    setError("");
    setPending(true);
    const value = String(
      new FormData(e.currentTarget).get(
        kind === "create" ? "familyName" : "code",
      ) || "",
    );
    try {
      const result = await onboarding({ kind, value });
      if (result.error) setError(result.error);
      else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Layanan belum terhubung. Coba kembali setelah koneksi pulih.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="mx-auto max-w-xl px-5 py-16">
      <h1 className="text-3xl font-bold">
        {invite ? "Ada ruang untuk Anda." : "Setiap keluarga punya awal."}
      </h1>
      <p className="mb-6 mt-3 text-sm leading-6 text-muted-foreground">
        Buat ruang baru atau bergabung dengan pasangan. Mulai langkah kecil hari
        ini.
      </p>
      <div className="panel">
        <Tabs defaultValue={invite ? "join" : "create"}>
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="create">
              <Home size={14} />
              Buat keluarga
            </TabsTrigger>
            <TabsTrigger value="join">
              <Users size={14} />
              Gabung keluarga
            </TabsTrigger>
          </TabsList>
          <TabsContent value="create">
            <RequestForm
              className="space-y-5"
              onSubmit={(e) => submit(e, "create")}
            >
              <label className="field">
                Nama keluarga
                <Input
                  name="familyName"
                  placeholder="Contoh: Keluarga Budi & Sari"
                  required
                  minLength={2}
                  maxLength={120}
                />
              </label>
              <p className="text-sm leading-6 text-muted-foreground">
                Dompet Rumah Tangga dan kategori kebutuhan sehari-hari akan
                disiapkan untuk Anda.
              </p>
              <Button
                loading={pending}
                disabled={pending}
                className="gradient-button w-full"
              >
                {pending ? "Menyiapkan ruang…" : "Buat Ruang Keluarga"}
              </Button>
            </RequestForm>
          </TabsContent>
          <TabsContent value="join">
            <RequestForm
              className="space-y-5"
              onSubmit={(e) => submit(e, "join")}
            >
              <label className="field">
                Kode undangan
                <Input
                  name="code"
                  defaultValue={invite || ""}
                  placeholder="Kode dari pasangan Anda"
                  required
                  maxLength={12}
                  className="text-center font-mono uppercase tracking-widest"
                />
              </label>
              <p className="text-sm text-muted-foreground">
                Undangan berlaku tujuh hari. Satu keluarga dapat diisi dua
                orang.
              </p>
              <Button
                loading={pending}
                disabled={pending}
                className="gradient-button w-full"
              >
                {pending ? "Menghubungkan…" : "Gabung Keluarga"}
              </Button>
            </RequestForm>
          </TabsContent>
        </Tabs>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
function DemoOnboarding({ invite }: { invite?: string }) {
  const { data, update, setUserId } = useDemo();
  const router = useRouter();
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);
  function join(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code"))
      .trim()
      .toUpperCase();
    if (code !== data.inviteCode) {
      setError(
        "Kode tidak ditemukan dalam demo. Gunakan DUIT-XY7A atau kode terbaru dari Pengaturan.",
      );
      return;
    }
    setError("");
    setJoined(true);
    setUserId("sari");
  }
  return (
    <section className="mx-auto max-w-xl px-5 py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft size={14} />
        Kembali ke beranda
      </Link>
      <h1 className="text-3xl font-bold">
        {invite ? "Ada ruang untuk Anda." : "Setiap keluarga punya awal."}
      </h1>
      <p className="mb-6 mt-3 text-sm leading-6 text-muted-foreground">
        {invite
          ? "Budi mengajak Anda merencanakan keuangan bersama di DuitKita."
          : "Buat ruang baru atau bergabung dengan pasangan. Mulai langkah kecil hari ini."}
      </p>
      <DemoNote />
      <div className="panel mt-6">
        {joined ? (
          <div className="text-center">
            <FeatureIcon name="heart" />
            <h2 className="mt-5 text-xl font-bold">Selamat datang, Sari!</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Anda sedang melihat {data.familyName} sebagai anggota demo.
            </p>
            <Button asChild className="gradient-button mt-6">
              <Link href="/dashboard">
                Masuk ke Ruang Kita <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        ) : (
          <Tabs defaultValue={invite ? "join" : "create"}>
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="create">
                <Home size={14} />
                Buat keluarga
              </TabsTrigger>
              <TabsTrigger value="join">
                <Users size={14} />
                Gabung keluarga
              </TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <RequestForm
                className="space-y-5"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const name = String(
                    new FormData(e.currentTarget).get("familyName"),
                  ).trim();
                  if (!name) return;
                  if (!(await update((d) => ({ ...d, familyName: name }))))
                    return;
                  setUserId("budi");
                  toast.success(
                    "Nama ruang demo diperbarui. Data contoh Budi & Sari siap dijelajahi.",
                  );
                  router.push("/dashboard");
                }}
              >
                <label className="field">
                  Nama keluarga
                  <Input
                    name="familyName"
                    required
                    maxLength={120}
                    defaultValue="Keluarga Budi & Sari"
                  />
                </label>
                <p className="text-sm leading-6 text-muted-foreground">
                  Dompet Rumah Tangga dan kategori kebutuhan sehari-hari sudah
                  disiapkan dalam demo.
                </p>
                <Button className="gradient-button w-full" type="submit">
                  Buka Ruang Demo <ArrowRight size={16} />
                </Button>
              </RequestForm>
            </TabsContent>
            <TabsContent value="join">
              <RequestForm onSubmit={join} className="space-y-5">
                <label className="field">
                  Kode undangan
                  <Input
                    name="code"
                    required
                    defaultValue={invite ?? ""}
                    placeholder="DUIT-XY7A"
                    maxLength={12}
                    className="text-center font-mono uppercase tracking-widest"
                  />
                </label>
                <p className="text-sm text-muted-foreground">
                  Kode contoh: <strong>DUIT-XY7A</strong>. Demo membuka profil
                  Sari yang sudah menjadi anggota keluarga.
                </p>
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button className="gradient-button w-full" type="submit">
                  Terima Undangan Demo <ArrowRight size={16} />
                </Button>
              </RequestForm>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </section>
  );
}
