import { pageMetadata } from "@/lib/seo";
import { AboutPage } from "@/features/public/marketing";
export function generateMetadata() { return pageMetadata("/tentang", "Tentang Kami"); }
export default function Page() {
  return <AboutPage />;
}
