"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/actions/auth";
import { RequestForm } from "@/components/ui/request-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function RecoveryForm() {
  const router = useRouter();
  const [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  return (
    <section className="mx-auto max-w-md px-5 py-16">
      <h1 className="mb-6 text-3xl font-bold">Buat kata sandi baru</h1>
      <RequestForm
        className="panel space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          setPending(true);
          try {
            const result = await changePassword(Object.fromEntries(form));
            if (result.error) setError(result.error);
            else {
              router.push("/dashboard");
              router.refresh();
            }
          } catch {
            setError("Kata sandi belum dapat diperbarui. Coba kembali.");
          } finally {
            setPending(false);
          }
        }}
      >
        <label className="field">
          Kata sandi baru
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="field">
          Konfirmasi kata sandi
          <Input
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Minimal 8 karakter, termasuk huruf dan angka.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          loading={pending}
          disabled={pending}
          className="gradient-button w-full"
        >
          {pending ? "Menyimpan…" : "Simpan Kata Sandi"}
        </Button>
      </RequestForm>
    </section>
  );
}
