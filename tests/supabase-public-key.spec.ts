import { test, expect } from "@playwright/test";
import { supabasePublicKey } from "../src/lib/supabase/public-key";

test("publishable key diprioritaskan dan anon key lama tetap didukung", () => {
  expect(supabasePublicKey(" sb_publishable_test ", "legacy")).toBe(
    "sb_publishable_test",
  );
  expect(supabasePublicKey("", " legacy ")).toBe("legacy");
  expect(supabasePublicKey("   ", "legacy")).toBe("legacy");
  expect(supabasePublicKey("", "")).toBeUndefined();
});
