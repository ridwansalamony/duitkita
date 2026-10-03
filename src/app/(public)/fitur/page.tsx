import { pageMetadata } from "@/lib/seo";
import { FeaturesPage } from "@/features/public/marketing";
export function generateMetadata() { return pageMetadata("/fitur", "Fitur"); }
export default function Page() {
  return <FeaturesPage />;
}
