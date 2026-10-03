import { pageMetadata } from "@/lib/seo";
import { Onboarding } from "@/features/public/forms";
import { isDemo } from "@/lib/mode";
import { withIdentity } from "@/db";
import { redirect } from "next/navigation";
export function generateMetadata() { return pageMetadata("/pengaturan-awal", "Mulai Keluarga"); }
export default async function Page() {
  if(!isDemo){const familyId=await withIdentity(async(_tx,id)=>id.familyId,false);if(familyId)redirect("/dashboard");}
  return <Onboarding />;
}
