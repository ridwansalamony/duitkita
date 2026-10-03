"use client";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import {
  Copy,
  RefreshCw,
  Users,
  ShieldCheck,
  ArrowRight,
  Trash2,
  Camera,
  Check,
  KeyRound,
  Heart,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { RequestForm } from "@/components/ui/request-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PageHeading,
  FeatureIcon,
  EmptyState,
  Reveal,
} from "@/components/shared/common";
import { useDemo } from "@/lib/dummy/store";
import type { User } from "@/lib/dummy/data";
import { isDemo } from "@/lib/mode";
import { changePassword } from "@/actions/auth";
import { resizeReceipt } from "@/lib/receipts/image";
function OwnerOnly({ children }: { children: React.ReactNode }) {
  const { user } = useDemo();
  return user.role === "owner" ? (
    <>{children}</>
  ) : (
    <EmptyState
      title="Ruang khusus pemilik keluarga"
      description="Pengaturan keluarga dan anggota dikelola oleh pemilik keluarga. Anda tetap dapat mengelola profil dan catatan keuangan."
      href="/profil"
      cta="Buka profil saya"
    />
  );
}
function InvitationCard() {
  const { data, familyId, user, update, log } = useDemo();
  const [confirm, setConfirm] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(data.inviteCode);
      toast.success("Kode undangan disalin");
    } catch {
      toast.info(`Salin kode ini secara manual: ${data.inviteCode}`);
    }
  }
  return (
    <section className="panel">
      <div className="flex items-center gap-3">
        <FeatureIcon name="heart" />
        <div>
          <h2 className="text-base font-bold">Ruang untuk pasangan Anda</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Bagikan kode undangan keluarga
          </p>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary/30 bg-secondary/50 p-4">
        <span className="font-mono text-xl font-bold tracking-[.15em] text-primary">
          {data.inviteCode}
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => void copy()}
          aria-label="Salin kode undangan"
        >
          <Copy size={16} />
        </Button>
      </div>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        {isDemo
          ? "Kode undangan berlaku selama sesi demo."
          : `Kode berlaku sampai ${data.inviteExpiresAt ? new Date(data.inviteExpiresAt).toLocaleString("id-ID") : "tujuh hari setelah dibuat"}.`}{" "}
        Satu keluarga menampung maksimal 2 anggota.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setConfirm(true)}>
          <RefreshCw size={14} />
          Buat Kode Baru
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/undang/${data.inviteCode}`}>
            Pratinjau Undangan <ArrowRight size={14} />
          </Link>
        </Button>
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perbarui kode undangan?</DialogTitle>
            <DialogDescription>
              Kode sebelumnya tidak lagi bisa dipakai. Bagikan kode baru kepada
              pasangan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Batal
            </Button>
            <Button
              onClick={async () => {
                if (user.role !== "owner") return;
                const code = `DUIT-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
                if (
                  !(await update((d) => ({
                    ...d,
                    inviteCode: code,
                    logs: log(
                      d,
                      "update",
                      "Keluarga",
                      familyId,
                      "Memperbarui kode undangan keluarga",
                    ),
                  })))
                )
                  return;
                setConfirm(false);
                toast.success("Kode undangan diperbarui");
              }}
            >
              Buat Kode Baru
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
function MembersPanel() {
  const { data, user, familyId, update, log } = useDemo();
  const [remove, setRemove] = useState<User | null>(null);
  const members = data.users.filter((u) => u.familyId === familyId);
  return (
    <section className="panel">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Anggota keluarga</h2>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs text-primary">
          {members.length} / 2 anggota
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Satu ruang yang dibangun atas kepercayaan.
      </p>
      <div className="mt-6 space-y-5">
        {members.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center gap-3 border-b pb-5 last:border-0 last:pb-0"
          >
            <span className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-secondary text-primary">
              {u.avatarUrl ? (
                <Image
                  src={u.avatarUrl}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className="size-full object-cover"
                />
              ) : (
                u.name[0]
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {u.name}{" "}
                {u.id === user.id && (
                  <span className="text-xs font-normal text-muted-foreground">
                    (Anda)
                  </span>
                )}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {u.email}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] ${u.role === "owner" ? "bg-secondary text-primary" : "bg-muted text-muted-foreground"}`}
            >
              {u.role === "owner" ? "Pemilik" : "Anggota"}
            </span>
            {u.role !== "owner" && user.role === "owner" && (
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Hapus anggota ${u.name}`}
                onClick={() => setRemove(u)}
              >
                <Trash2 size={15} className="text-muted-foreground" />
              </Button>
            )}
          </div>
        ))}
      </div>
      {isDemo && members.length < 2 && (
        <div className="mt-6 rounded-xl border border-dashed p-4">
          <p className="text-xs leading-6 text-muted-foreground">
            Masih ada satu tempat untuk pasangan. Pada demo, Anda dapat
            memulihkan keanggotaan Sari tanpa mengirim undangan.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={async () => {
              if (user.role !== "owner") return;
              if (
                !(await update((d) => ({
                  ...d,
                  users: d.users.map((u) =>
                    u.id === "sari" && u.familyId === null
                      ? { ...u, familyId }
                      : u,
                  ),
                  logs: log(
                    d,
                    "create",
                    "Anggota",
                    "sari",
                    "Memulihkan keanggotaan Sari dalam demo",
                  ),
                })))
              )
                return;
              toast.success("Sari kembali menjadi anggota keluarga demo");
            }}
          >
            <UserPlus size={14} />
            Pulihkan Anggota Demo
          </Button>
        </div>
      )}
      <Dialog
        open={!!remove}
        onOpenChange={(v) => {
          if (!v) setRemove(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keluarkan {remove?.name} dari keluarga?</DialogTitle>
            <DialogDescription>
              Keanggotaan dihentikan. Riwayat transaksi dan tabungan tetap
              tersimpan. Saldo dompet tetap menjadi bagian catatan historis
              keluarga.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemove(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!remove || user.role !== "owner") return;
                if (
                  !(await update((d) => ({
                    ...d,
                    users: d.users.map((u) =>
                      u.familyId === familyId && u.id === remove.id
                        ? { ...u, familyId: null }
                        : u,
                    ),
                    logs: log(
                      d,
                      "delete",
                      "Anggota",
                      remove.id,
                      `Mengeluarkan ${remove.name} dari keluarga`,
                    ),
                  })))
                )
                  return;
                setRemove(null);
                toast.success(
                  "Keanggotaan dihentikan; riwayat tetap tersimpan",
                );
              }}
            >
              Keluarkan Anggota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
export function SettingsPage() {
  const { data, user, familyId, update, log } = useDemo();
  return (
    <OwnerOnly>
      <Reveal>
        <PageHeading
          title="Ruang yang terasa seperti rumah"
          description="Kelola identitas keluarga, undangan, dan orang yang berbagi rencana dengan Anda."
        />
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <section className="panel">
              <h2 className="text-base font-bold">Identitas keluarga</h2>
              <RequestForm
                className="mt-6 space-y-5"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (user.role !== "owner") return;
                  const name = String(
                    new FormData(e.currentTarget).get("name"),
                  ).trim();
                  if (!name) {
                    toast.error("Nama keluarga perlu diisi");
                    return;
                  }
                  if (
                    !(await update((d) => ({
                      ...d,
                      familyName: name,
                      logs: log(
                        d,
                        "update",
                        "Keluarga",
                        familyId,
                        `Mengubah nama keluarga menjadi ${name}`,
                      ),
                    })))
                  )
                    return;
                  toast.success("Nama keluarga diperbarui");
                }}
              >
                <label className="field">
                  Nama keluarga
                  <Input
                    key={data.familyName}
                    name="name"
                    defaultValue={data.familyName}
                    maxLength={120}
                    required
                  />
                </label>
                <label className="field">
                  Mata uang
                  <Input
                    value="Rupiah Indonesia (IDR)"
                    readOnly
                    className="bg-muted"
                  />
                </label>
                <Button type="submit" className="gradient-button">
                  <Check size={15} />
                  Simpan Perubahan
                </Button>
              </RequestForm>
            </section>
            <InvitationCard />
          </div>
          <div className="space-y-6">
            <MembersPanel />
            <section className="panel">
              <h2 className="text-base font-bold">Profil dan keamanan</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Nama, foto, dan kata sandi Anda dikelola melalui halaman profil
                pribadi.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/profil">
                  Kelola Profil Saya <ArrowRight size={14} />
                </Link>
              </Button>
            </section>
          </div>
        </div>
      </Reveal>
    </OwnerOnly>
  );
}
export function ProfilePage() {
  const { data, user, familyId, update, log } = useDemo();
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadBusy = useRef(false);
  async function upload(file?: File) {
    if (!file || uploadBusy.current) return;
    if (
      !["image/jpeg", "image/png"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      toast.error("Pilih foto JPG/PNG maksimal 2 MB");
      return;
    }
    uploadBusy.current = true;
    setUploading(true);
    try {
      const image = isDemo ? file : await resizeReceipt(file, 384);
      const avatarUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Foto tidak terbaca"));
        reader.readAsDataURL(image);
      });
      if (
        !(await update((d) => ({
          ...d,
          users: d.users.map((u) =>
            u.familyId === familyId && u.id === user.id
              ? { ...u, avatarUrl }
              : u,
          ),
          logs: log(d, "update", "Profil", user.id, "Memperbarui foto profil"),
        })))
      )
        return;
      toast.success("Foto profil diperbarui");
    } catch {
      toast.error("Foto belum dapat diperbarui. Coba kembali.");
    } finally {
      uploadBusy.current = false;
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <Reveal>
      <PageHeading
        title="Sedikit tentang Anda"
        description="Nyaman jadi diri sendiri, sambil merencanakan masa depan berdua."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[.75fr_1.25fr]">
        <section className="panel text-center">
          <div className="relative mx-auto size-24">
            <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-secondary text-3xl font-bold text-primary">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={`Foto ${user.name}`}
                  width={96}
                  height={96}
                  className="size-full object-cover"
                  unoptimized
                />
              ) : (
                user.name[0]
              )}
            </div>
            <Button
              size="icon"
              className="absolute -bottom-1 -right-1 rounded-full border-4 border-card"
              aria-label="Ubah foto profil"
              loading={uploading}
              onClick={() => input.current?.click()}
            >
              <Camera size={15} />
            </Button>
          </div>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            aria-label="Pilih foto profil"
            disabled={uploading}
            onChange={(e) => void upload(e.target.files?.[0])}
          />
          <h2 className="mt-5 text-xl font-bold">{user.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-primary">
            <ShieldCheck size={12} />
            {user.role === "owner" ? "Pemilik keluarga" : "Anggota keluarga"}
          </span>
          <div className="mt-6 border-t pt-5">
            <p className="text-xs font-medium">{data.familyName}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Foto JPG/PNG, maksimal 2 MB
            </p>
          </div>
        </section>
        <div className="space-y-6">
          <section className="panel">
            <h2 className="text-base font-bold">Informasi pribadi</h2>
            <RequestForm
              key={user.id}
              className="mt-6 space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const name = String(f.get("name")).trim();
                if (!name) {
                  toast.error("Nama lengkap perlu diisi");
                  return;
                }
                if (
                  !(await update((d) => ({
                    ...d,
                    users: d.users.map((u) =>
                      u.familyId === familyId && u.id === user.id
                        ? { ...u, name }
                        : u,
                    ),
                    logs: log(
                      d,
                      "update",
                      "Profil",
                      user.id,
                      "Memperbarui nama profil",
                    ),
                  })))
                )
                  return;
                toast.success("Profil berhasil disimpan");
              }}
            >
              <label className="field">
                Nama lengkap
                <Input
                  name="name"
                  required
                  minLength={2}
                  maxLength={120}
                  defaultValue={user.name}
                />
              </label>
              <label className="field">
                Alamat email
                <Input
                  type="email"
                  value={user.email}
                  readOnly
                  className="bg-muted"
                />
                <span className="text-[11px] font-normal text-muted-foreground">
                  Email digunakan untuk masuk dan pemulihan akun.
                </span>
              </label>
              <Button className="gradient-button" type="submit">
                Simpan Profil
              </Button>
            </RequestForm>
          </section>
          <section className="panel">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <KeyRound size={18} />
              Ganti kata sandi
            </h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {isDemo
                ? "Demo hanya memvalidasi isian. Kata sandi tidak disimpan atau dikirim."
                : "Gunakan kata sandi yang unik, minimal 8 karakter dengan huruf dan angka."}
            </p>
            <RequestForm
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const form = e.currentTarget;
                if (f.get("new") !== f.get("confirm")) {
                  setError("Konfirmasi kata sandi belum sama.");
                  return;
                }
                setError("");
                if (!isDemo) {
                  try {
                    const result = await changePassword({
                      password: f.get("new"),
                      confirm: f.get("confirm"),
                      old: f.get("old"),
                    });
                    if (result.error) {
                      setError(result.error);
                      return;
                    }
                    form.reset();
                    toast.success("Kata sandi berhasil diperbarui.");
                  } catch {
                    setError(
                      "Kata sandi belum dapat diperbarui. Coba kembali.",
                    );
                  }
                  return;
                }
                form.reset();
                toast.success(
                  "Format kata sandi valid. Tidak ada kata sandi yang diubah dalam demo.",
                );
              }}
              className="mt-5 space-y-5"
            >
              <label className="field">
                Kata sandi saat ini
                <Input
                  name="old"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                />
              </label>
              <label className="field">
                Kata sandi baru
                <Input
                  name="new"
                  type="password"
                  autoComplete="new-password"
                  required
                  pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,}"
                  title="Minimal 8 karakter, kombinasi huruf dan angka"
                  minLength={8}
                />
              </label>
              <label className="field">
                Konfirmasi kata sandi baru
                <Input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </label>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button variant="outline" type="submit">
                {isDemo ? "Coba Ganti Kata Sandi" : "Ganti Kata Sandi"}
              </Button>
            </RequestForm>
          </section>
        </div>
      </div>
    </Reveal>
  );
}
export function AdminDashboard() {
  const { data, familyId } = useDemo();
  const members = data.users.filter((u) => u.familyId === familyId);
  return (
    <OwnerOnly>
      <Reveal>
        <PageHeading
          eyebrow="Ruang pemilik"
          title="Keluarga kompak, rencana matang."
          description="Ringkasan ruang keluarga dan orang-orang yang menjaganya bersama Anda."
        />
        <div className="mb-7 grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Anggota keluarga",
              value: `${members.length} / 2`,
              icon: Users,
            },
            {
              label: "Dompet bersama",
              value: data.wallets.filter(
                (w) => w.familyId === familyId && w.type === "shared",
              ).length,
              icon: ShieldCheck,
            },
            {
              label: "Target aktif",
              value: data.goals.filter(
                (g) => g.familyId === familyId && g.status === "active",
              ).length,
              icon: Heart,
            },
          ].map((s) => (
            <div key={s.label} className="panel">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="text-primary" size={20} />
              </div>
              <p className="number mt-4 text-3xl font-semibold">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <MembersPanel />
            <div className="panel">
              <h2 className="text-base font-bold">
                Kepercayaan dimulai dari keterbukaan
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Lihat perubahan terbaru dalam keluarga dan pastikan rencana Anda
                berdua tetap sejalan.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/riwayat-aktivitas">
                  Lihat Riwayat Aktivitas <ArrowRight size={15} />
                </Link>
              </Button>
            </div>
          </div>
          <div className="space-y-6">
            <InvitationCard />
            <div className="panel">
              <h2 className="text-base font-bold">Kelola ruang keluarga</h2>
              <div className="mt-4 grid gap-3">
                <Link
                  className="flex justify-between rounded-xl bg-muted p-4 text-sm"
                  href="/pengaturan"
                >
                  Identitas & pengaturan <ArrowRight size={16} />
                </Link>
                <Link
                  className="flex justify-between rounded-xl bg-muted p-4 text-sm"
                  href="/pemilik/anggota"
                >
                  Keanggotaan & undangan <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </OwnerOnly>
  );
}
export function AdminMembers() {
  return (
    <OwnerOnly>
      <Reveal>
        <PageHeading
          eyebrow="Ruang pemilik"
          title="Orang di balik rencana kita"
          description="Kelola keanggotaan dan undang pasangan ke ruang keluarga Anda."
        />
        <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_1fr]">
          <MembersPanel />
          <InvitationCard />
        </div>
        <div className="mt-6 rounded-2xl bg-secondary/50 p-5">
          <h2 className="text-sm font-bold text-secondary-foreground">
            Bersama bukan berarti tanpa batas
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Pemilik mengelola keluarga dan undangan. Setiap anggota dapat
            mencatat transaksi, melihat laporan yang diizinkan, dan mendukung
            target bersama. Semua dompet dapat diakses bersama dalam keluarga.
          </p>
        </div>
      </Reveal>
    </OwnerOnly>
  );
}
