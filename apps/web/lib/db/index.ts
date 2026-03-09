import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

function isLocalPostgres(): boolean {
  const url = process.env.POSTGRES_URL ?? "";
  return url.includes("localhost") || url.includes("127.0.0.1");
}

function createDb() {
  if (isLocalPostgres()) {
    return drizzleNode(process.env.POSTGRES_URL!, { schema });
  }
  const sql = neon(process.env.POSTGRES_URL!);
  return drizzleNeon(sql, { schema });
}

let _db: ReturnType<typeof createDb> | undefined;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop, receiver) {
    if (!_db) _db = createDb();
    return Reflect.get(_db, prop, receiver);
  },
});
