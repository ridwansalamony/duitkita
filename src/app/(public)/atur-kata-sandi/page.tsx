import { pageMetadata } from "@/lib/seo";
import { RecoveryForm } from "@/features/public/recovery";
export function generateMetadata() { return pageMetadata("/atur-kata-sandi", "Atur Kata Sandi"); }
export default function Page(){return <RecoveryForm/>;}
