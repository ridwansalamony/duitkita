import { pageMetadata } from "@/lib/seo";
import { AuthForm } from "@/features/public/forms";
export function generateMetadata() { return pageMetadata("/masuk", "Masuk"); }
export default function Page() {
  return <AuthForm mode="login" />;
}
