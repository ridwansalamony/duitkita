import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { WorkspaceProvider } from "../../src/lib/workspace/provider";
import { GoalsPage } from "../../src/features/goals/goals";
import { Button } from "../../src/components/ui/button";
import { useDemo } from "../../src/lib/dummy/store";
import * as seed from "../../src/lib/dummy/data";

declare global {
  interface Window {
    harness: {
      calls: number;
      resolve: (success: boolean) => void;
      mutate: () => Promise<unknown>;
      emit: () => void;
      listen: (callback: () => void) => void;
      initial: unknown;
    };
  }
}
let settle: (value: unknown) => void;
window.harness = {
  calls: 0,
  resolve: (success) =>
    settle({ success, family: null, error: "Simpan ditolak untuk pengujian" }),
  mutate: () => {
    window.harness.calls++;
    return new Promise((resolve) => {
      settle = resolve;
    });
  },
  emit: () => {},
  listen: (callback) => {
    window.harness.emit = callback;
  },
  initial: null,
};
const initial = {
  familyName: "Keluarga Budi & Sari",
  inviteCode: "DUIT-XY7A",
  users: seed.users,
  wallets: seed.wallets,
  categories: seed.categories,
  transactions: seed.transactions,
  goals: seed.goals,
  contributions: seed.contributions,
  logs: seed.auditLogs,
};
window.harness.initial = {
  success: true,
  data: initial,
  identity: { familyId: seed.FAMILY_ID },
};
function Actions() {
  const { data } = useDemo();
  return (
    <>
      <output data-testid="goals">
        {JSON.stringify(data.goals.map((g) => g.name))}
      </output>
      <Button
        onClick={async () => {
          await window.harness.mutate();
        }}
      >
        Hapus contoh
      </Button>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <WorkspaceProvider initial={initial} userId="budi" familyId={seed.FAMILY_ID}>
    <GoalsPage />
    <Actions />
    <Toaster />
  </WorkspaceProvider>,
);
