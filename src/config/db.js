import mysql from "mysql2/promise";
import { env } from "./env.js";

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
      connectionLimit: 10,
      namedPlaceholders: true,
      ...(env.db.ssl
        ? {
            ssl: {
              rejectUnauthorized: true,
              ...(env.db.sslCa ? { ca: env.db.sslCa } : {}),
            },
          }
        : {}),
    });
  }
  return pool;
}

export async function query(sql, params = {}) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}
