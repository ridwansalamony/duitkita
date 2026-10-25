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
  const previousUsers = new Map(before.users.map((u) => [u.id, u]));
  for (const u of after.users) {
    const old = previousUsers.get(u.id);
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
    if (old === next) continue;
    const previous = new Map(old.map((v) => [v.id, v]));
    const nextIds = new Set(next.map((v) => v.id));
    const removed = old.find((v) => !nextIds.has(v.id));
    if (removed) return { entity, action: "delete", value: removed.id };
    for (const v of next) {
      const prior = previous.get(v.id);
      if (!prior) return { entity, action: "create", value: v };
      if (prior !== v && JSON.stringify(prior) !== JSON.stringify(v))
        return { entity, action: "update", value: v };
    }
  }
  throw new Error("Tidak ada perubahan untuk disimpan.");
}
