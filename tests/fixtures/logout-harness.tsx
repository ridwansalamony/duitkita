import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { LogoutMenuItem } from "@/components/layouts/logout-menu-item";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
createRoot(document.getElementById("root")!).render(
  <>
    <DropdownMenu>
      <DropdownMenuTrigger>Menu akun</DropdownMenuTrigger>
      <DropdownMenuContent>
        <LogoutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
    <Toaster />
  </>,
);
