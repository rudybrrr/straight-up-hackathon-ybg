import mysql, { type Pool } from "mysql2/promise";
import { loadLocalEnv } from "@/lib/load-env";

loadLocalEnv();

let pool: Pool | null = null;

function getConnectionConfig() {
  const url = process.env.MYSQL_URL ?? process.env.DATABASE_URL;

  if (url) {
    return { uri: url };
  }

  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;

  if (!host || !user || password === undefined || !database) {
    throw new Error(
      "Missing MySQL configuration. Set MYSQL_URL, or MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE."
    );
  }

  return {
    host,
    user,
    password,
    database,
    port: Number(process.env.MYSQL_PORT ?? 3306)
  };
}

export function getMysqlPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...getConnectionConfig(),
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: false,
      timezone: "Z"
    });
  }

  return pool;
}

export async function closeMysqlPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
