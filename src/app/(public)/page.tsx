import { siteUrl, pageMetadata } from "@/lib/seo";
import { Landing } from "@/features/public/marketing";
export function generateMetadata() { return pageMetadata("/"); }
export default function Page() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "DuitKita", applicationCategory: "FinanceApplication", operatingSystem: "Web", url: siteUrl(), description: "Pencatatan keuangan bersama pasangan, budget bulanan, dan target tabungan keluarga.", inLanguage: "id" }).replace(/</g, "\\u003c") }} /><Landing /></>;
}
