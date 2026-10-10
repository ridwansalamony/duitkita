import { test, expect } from "@playwright/test";
import { runtimeDatabaseUrl } from "../src/db/runtime-url";

test("runtime memakai transaction pooler tanpa mengubah kredensial atau server lain", () => {
  const original =
    "postgres://postgres.project:p%40ss@aws-0-region.pooler.supabase.com:5432/postgres?sslmode=require";
  const url = new URL(runtimeDatabaseUrl(original));
  expect(url.port).toBe("6543");
  expect(url.password).toBe("p%40ss");
  expect(url.search).toBe("?sslmode=require");
  expect(runtimeDatabaseUrl("postgres://u:p@localhost:5432/test")).toBe(
    "postgres://u:p@localhost:5432/test",
  );
  expect(
    runtimeDatabaseUrl("postgres://u:p@db.project.supabase.co:5432/postgres"),
  ).toBe("postgres://u:p@db.project.supabase.co:5432/postgres");
});
