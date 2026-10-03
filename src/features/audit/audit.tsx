"use client";
import { useState } from "react";
import { Search, History, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { PageHeading, EmptyState, Reveal } from "@/components/shared/common";
import { useDemo } from "@/lib/dummy/store";
import { tanggal } from "@/lib/utils";
const labels = { create: "Ditambahkan", update: "Diubah", delete: "Dihapus" };
const colors = {
  create: "bg-success-surface text-success",
  update: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  delete: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
};
export function AuditPage() {
  const { data, user, familyId } = useDemo();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [member, setMember] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const logs = data.logs.filter(
    (l) =>
      l.familyId === familyId &&
      (!l.privateOwnerId || l.privateOwnerId === user.id) &&
      (!action || l.action === action) &&
      (!member || l.userId === member) &&
      (!date || l.date.slice(0, 10) === date) &&
      l.detail.toLowerCase().includes(search.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(logs.length / 10));
  const current = Math.min(page, pages);
  return (
    <Reveal>
      <PageHeading
        title="Terbuka, jadi lebih percaya."
        description="Jejak aktivitas keluarga, agar setiap perubahan punya cerita yang jelas."
        action={
          <span className="flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck size={15} className="text-primary" />
            Riwayat tidak dapat diubah
          </span>
        }
      />
      <div className="panel">
        <div className="mb-6 grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <label className="field text-xs">
            Cari aktivitas
            <span className="relative">
              <Search
                className="absolute left-3 top-3 text-muted-foreground"
                size={14}
              />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari cerita aktivitas…"
                className="pl-9"
              />
            </span>
          </label>
          <label className="field text-xs">
            Jenis aktivitas
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua aktivitas</option>
              <option value="create">Ditambahkan</option>
              <option value="update">Diubah</option>
              <option value="delete">Dihapus</option>
            </select>
          </label>
          <label className="field text-xs">
            Anggota
            <select
              value={member}
              onChange={(e) => {
                setMember(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua anggota</option>
              {data.users
                .filter((u) => u.familyId === familyId)
                .map((u) => (
                  <option value={u.id} key={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="field text-xs">
            Tanggal
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
        {logs.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aktivitas</TableHead>
                <TableHead>Anggota</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.slice((current - 1) * 10, current * 10).map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="flex max-w-md items-start gap-3 py-2">
                      <span className="mt-1 rounded-lg bg-muted p-2 text-muted-foreground">
                        <History size={15} />
                      </span>
                      <div>
                        <p className="whitespace-normal text-xs leading-6">
                          {l.detail}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {l.entity} · {l.entityId.slice(0, 16)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {data.users.find(
                      (u) => u.familyId === familyId && u.id === l.userId,
                    )?.name ?? "Mantan anggota"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${colors[l.action]}`}
                    >
                      {labels[l.action]}
                    </span>
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">
                    {tanggal(l.date, true)}
                    <span className="mt-1 block">
                      {new Intl.DateTimeFormat("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Jakarta",
                      }).format(new Date(l.date))}{" "}
                      WIB
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="Tidak ada aktivitas yang cocok"
            description="Coba filter lain atau lakukan perubahan pada catatan keluarga untuk melihat riwayatnya."
          />
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <p className="text-[11px] text-muted-foreground">
            {logs.length} aktivitas · halaman {current} dari {pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setAction("");
                setMember("");
                setDate("");
                setPage(1);
              }}
            >
              Reset filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
