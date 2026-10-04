import { test, expect } from "@playwright/test";
import { appUrl } from "../src/lib/app-url";

test("Vercel mengabaikan localhost dan memakai domain production", () => {
  for (const value of [
    undefined,
    "http://localhost:3000",
    "https://localhost",
    "http://127.0.0.1:3000",
    "bukan URL",
  ]) {
    expect(
      appUrl({
        VERCEL: "1",
        NEXT_PUBLIC_APP_URL: value,
        VERCEL_PROJECT_PRODUCTION_URL: "duitkita-mu.vercel.app",
      }),
    ).toBe("https://duitkita-mu.vercel.app");
  }
});
test("domain custom eksplisit tetap dipakai untuk tautan dan callback", () => {
  expect(
    appUrl({
      VERCEL: "1",
      NEXT_PUBLIC_APP_URL: "https://keluarga.example/path?next=test",
      VERCEL_PROJECT_PRODUCTION_URL: "duitkita-mu.vercel.app",
    }),
  ).toBe("https://keluarga.example");
});
test("Vercel tanpa domain tepercaya tidak kembali ke localhost", () => {
  expect(() =>
    appUrl({ VERCEL: "1", NEXT_PUBLIC_APP_URL: "http://localhost:3000" }),
  ).toThrow("URL production");
  expect(() =>
    appUrl({
      VERCEL: "1",
      VERCEL_PROJECT_PRODUCTION_URL: "user@evil.example/path",
    }),
  ).toThrow();
});
test("development lokal tetap berfungsi", () => {
  expect(appUrl({})).toBe("http://localhost:3000");
  expect(appUrl({ NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3001" })).toBe(
    "http://127.0.0.1:3001",
  );
});
