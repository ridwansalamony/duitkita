import { pageMetadata } from "@/lib/seo";
import { ContactForm } from "@/features/public/forms";
export function generateMetadata() { return pageMetadata("/kontak", "Hubungi Kami"); }
export default function Page() {
  return <ContactForm />;
}
