import type { Metadata } from "next";
import { AppShell } from "@/components/layouts/app-shell";
import { isDemo } from "@/lib/mode";
import { supabaseServer } from "@/lib/supabase/server";
import { withIdentity } from "@/db";
import { getWorkspace } from "@/db/queries";
import { WorkspaceProvider } from "@/lib/workspace/provider";
import { redirect } from "next/navigation";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function Layout({ children }: { children: React.ReactNode }) {
  if(isDemo)return <AppShell>{children}</AppShell>;
  const {data:{user}}=await (await supabaseServer()).auth.getUser();
  if(!user)redirect("/masuk");
  const familyId=await withIdentity(async(_tx,id)=>id.familyId,false);
  if(!familyId)redirect("/pengaturan-awal");
  const workspace=await getWorkspace();
  return <WorkspaceProvider initial={workspace.data} userId={user.id} familyId={familyId}><AppShell>{children}</AppShell></WorkspaceProvider>;
}
