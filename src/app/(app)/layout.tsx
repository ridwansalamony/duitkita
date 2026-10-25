import type { Metadata } from "next";
import { AppShell } from "@/components/layouts/app-shell";
import { isDemo } from "@/lib/mode";
import { getWorkspace } from "@/db/queries";
import { WorkspaceProvider } from "@/lib/workspace/provider";
import { redirect } from "next/navigation";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isDemo) return <AppShell>{children}</AppShell>;
  // getWorkspace verifies Auth and derives the family from the protected profile.
  // Avoid repeating the same Auth request and profile transaction in this layout.
  let workspace;
  try {
    workspace = await getWorkspace();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sesi berakhir. Silakan masuk kembali."
    )
      redirect("/masuk");
    if (
      error instanceof Error &&
      error.message === "Selesaikan pengaturan keluarga terlebih dahulu."
    )
      redirect("/pengaturan-awal");
    throw error;
  }
  const { userId, familyId } = workspace.identity;
  return (
    <WorkspaceProvider
      key={`${familyId}:${userId}`}
      initial={workspace.data}
      userId={userId}
      familyId={familyId}
    >
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
