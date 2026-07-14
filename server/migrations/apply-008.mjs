// One-shot runner for 008_voice_forwarding.sql. Run from the app root:
//   node server/migrations/apply-008.mjs
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
process.loadEnvFile?.(new URL("./.env", `file://${process.cwd()}/`));
const sql = await readFile(new URL("./server/migrations/008_voice_forwarding.sql", `file://${process.cwd()}/`), "utf8");
const conn = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, multipleStatements: true,
});
await conn.query(sql);
const [cols] = await conn.query("SHOW COLUMNS FROM users");
const names = cols.map((c) => c.Field);
console.log("users has forward_number:", names.includes("forward_number"));
console.log("users has sip_username:", names.includes("sip_username"));
const [t] = await conn.query("SHOW TABLES LIKE 'voicemails'");
console.log("voicemails table present:", t.length === 1);
await conn.end();
