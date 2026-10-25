"use client";
import { useState } from "react";
import { Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequestForm } from "@/components/ui/request-form";
import { FeatureIcon } from "./feature-icon";
export function ContactForm() {
  const [sent, setSent] = useState(false);
  return (
    <section className="mx-auto grid max-w-6xl gap-14 px-5 py-16 md:grid-cols-2 md:px-8">
      <div>
        <p className="text-sm font-semibold text-primary">Mari mengobrol</p>
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
      <div className="rounded-2xl border bg-card p-6 md:p-8">
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
