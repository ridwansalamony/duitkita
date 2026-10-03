import { pageMetadata } from "@/lib/seo";
import { AuthForm } from "@/features/public/forms";
export function generateMetadata() { return pageMetadata("/lupa-kata-sandi", "Pulihkan Kata Sandi"); }
export default function Page() {
  return <AuthForm mode="reset" />;
}
