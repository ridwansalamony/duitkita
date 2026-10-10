import { pageMetadata } from "@/lib/seo";
import { AboutPage } from "@/features/public/marketing";
export function generateMetadata() { return pageMetadata("/tentang"); }
export default function Page() {
  return <AboutPage />;
}
