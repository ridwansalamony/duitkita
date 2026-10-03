"use client";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { DemoProvider } from "@/lib/dummy/store";
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <DemoProvider>
        <Toaster
          richColors
          position="top-center"
          containerAriaLabel="Pemberitahuan"
        />
        {children}
      </DemoProvider>
    </ThemeProvider>
  );
}
