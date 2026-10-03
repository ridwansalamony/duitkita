import { pageMetadata } from "@/lib/seo";
import { AuthForm } from "@/features/public/forms";
export function generateMetadata() { return pageMetadata("/daftar", "Daftar"); }
export default function Page() {
  return <AuthForm mode="register" />;
}
