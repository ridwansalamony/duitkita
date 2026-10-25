"use client";
import type { ImgHTMLAttributes } from "react";
import { useTheme } from "next-themes";
export function ProductPicture({
  light,
  darkSrcSet,
}: {
  light: ImgHTMLAttributes<HTMLImageElement>;
  darkSrcSet?: string;
}) {
  const { theme } = useTheme();
  const media =
    theme === "dark"
      ? "all"
      : theme === "light"
        ? "not all"
        : "(prefers-color-scheme: dark)";
  return (
    <picture>
      <source media={media} srcSet={darkSrcSet} sizes={light.sizes} />
      {/* getImageProps supplies Next.js optimized sources and reserved image dimensions. */}
      <img {...light} alt={light.alt ?? ""} className="block h-auto w-full" />
    </picture>
  );
}
