import { pageMetadata } from "@/lib/seo";
import { Onboarding } from "@/features/public/forms";
import { isDemo } from "@/lib/mode";
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export function generateMetadata() { return pageMetadata("/undang", "Undangan Keluarga"); }
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if(!isDemo){const {data:{user}}=await (await supabaseServer()).auth.getUser();if(!user)redirect(`/masuk?next=${encodeURIComponent(`/undang/${code}`)}`);}
  return <Onboarding invite={code} />;
}
