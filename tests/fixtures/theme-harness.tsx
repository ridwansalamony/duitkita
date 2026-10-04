import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "../../src/components/shared/theme-toggle";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <ThemeToggle />
  </ThemeProvider>,
);
