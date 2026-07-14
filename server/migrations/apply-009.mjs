// One-shot runner for 009_support_chat.sql. Run from the app root:
//   node server/migrations/apply-009.mjs
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
process.loadEnvFile?.(new URL("./.env", `file://${process.cwd()}/`));
const sql = await readFile(new URL("./server/migrations/009_support_chat.sql", `file://${process.cwd()}/`), "utf8");
const conn = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, multipleStatements: true,
});
await conn.query(sql);
const [t1] = await conn.query("SHOW TABLES LIKE 'support_messages'");
const [t2] = await conn.query("SHOW TABLES LIKE 'agents'");
console.log("support_messages table:", t1.length === 1);
console.log("agents table:", t2.length === 1);
await conn.end();
