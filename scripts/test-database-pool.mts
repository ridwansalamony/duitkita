import { config } from "dotenv";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
config({ path: ".env.local", quiet: true });
const require = createRequire(import.meta.url);
const modulePath = require.resolve("../src/db/connection.ts");
const { databaseConnection } = require(modulePath) as typeof import("../src/db/connection");
const client = databaseConnection();
try {
  for (let i = 0; i < 20; i++) {
    delete require.cache[modulePath];
    const reloaded = require(modulePath) as typeof import("../src/db/connection");
    assert.equal(reloaded.databaseConnection(), client);
  }
  assert.equal(client.options.max, 2);
  assert.equal(client.options.idle_timeout, 20);
  await Promise.all(Array.from({ length: 30 }, async () => {
    const identity = crypto.randomUUID();
    await client.begin(async (tx) => {
      await tx`set local role authenticated`;
      await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: identity, role: "authenticated" })}, true)`;
      await tx`select pg_sleep(0.03)`;
      const result = await tx`select auth.uid()::text as id`;
      assert.equal(result[0].id, identity);
    });
  }));
  await client.begin(async (tx) => {
    const result = await tx`select current_user as role, nullif(current_setting('request.jwt.claims',true),'') as claims`;
    assert.notEqual(result[0].role, "authenticated");
    assert.equal(result[0].claims, null);
  });
  console.log("Lulus: 20 pemuatan ulang memakai pool yang sama; 30 transaksi paralel selesai melalui maksimal 2 koneksi; identitas transaksi tidak bocor. Tidak ada data yang ditulis.");
} catch (error) {
  console.error(JSON.stringify({ check: "gagal", code: (error as { code?: string }).code || "ASSERTION" }));
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 2 });
}
