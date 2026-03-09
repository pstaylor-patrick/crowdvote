import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const sql = neon(process.env.POSTGRES_URL!);
  return drizzle(sql, { schema });
}

let _db: ReturnType<typeof createDb> | undefined;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop, receiver) {
    if (!_db) _db = createDb();
    return Reflect.get(_db, prop, receiver);
  },
});
