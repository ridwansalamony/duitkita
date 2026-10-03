import type { DemoData } from "@/lib/dummy/store";
export type Intent = {
  entity: string;
  action: "create" | "update" | "delete";
  value: unknown;
};
// UI mengirim satu niat mutasi. Server menentukan family_id, pencatat, hak akses, dan audit.
export function mutationIntent(
  before: DemoData,
  after: DemoData,
  userId: string,
): Intent {
  if (before.familyName !== after.familyName)
    return { entity: "family", action: "update", value: after.familyName };
  if (before.inviteCode !== after.inviteCode)
    return { entity: "invite", action: "update", value: null };
  for (const u of after.users) {
    const old = before.users.find((v) => v.id === u.id);
    if (old?.familyId && !u.familyId)
      return { entity: "member", action: "delete", value: u.id };
    if (u.id === userId && JSON.stringify(old) !== JSON.stringify(u))
      return { entity: "profile", action: "update", value: u };
  }
  // Saldo target dihitung dari dompet, tidak dikirim sebagai mutasi tambahan.
  for (const entity of [
    "categories",
    "wallets",
    "goals",
    "transactions",
  ] as const) {
    const old = before[entity],
      next = after[entity];
    const removed = old.find((v) => !next.some((n) => n.id === v.id));
    if (removed) return { entity, action: "delete", value: removed.id };
    for (const v of next) {
      const prior = old.find((p) => p.id === v.id);
      if (!prior) return { entity, action: "create", value: v };
      if (JSON.stringify(prior) !== JSON.stringify(v))
        return { entity, action: "update", value: v };
    }
  }
  throw new Error("Tidak ada perubahan untuk disimpan.");
}
