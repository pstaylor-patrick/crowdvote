import { neon } from "@neondatabase/serverless";
import * as readline from "readline";

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) {
  console.error("Error: POSTGRES_URL is not set. Is .env.local loaded?");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const sql = neon(POSTGRES_URL!);

  // Discover schemas to drop
  const schemas = ["public"];
  const drizzleCheck = await sql`
    SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'drizzle'
  `;
  if (drizzleCheck.length > 0) {
    schemas.push("drizzle");
  }

  // List tables in public schema
  const tables = await sql`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema IN ('public', 'drizzle')
    ORDER BY table_schema, table_name
  `;

  console.log("\nSchemas to drop:", schemas.join(", "));
  console.log("\nTables that will be destroyed:");
  if (tables.length === 0) {
    console.log("  (none found)");
  } else {
    for (const t of tables) {
      console.log(`  ${t.table_schema}.${t.table_name}`);
    }
  }

  if (dryRun) {
    console.log("\n--dry-run: No changes made.");
    process.exit(0);
  }

  // Prompt for confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question('\nThis will permanently destroy all data. Type "yes" to confirm: ', resolve);
  });
  rl.close();

  if (answer.trim().toLowerCase() !== "yes") {
    console.log("Aborted.");
    process.exit(0);
  }

  console.log("\nDropping schemas...");

  // Drop drizzle schema if it exists
  if (schemas.includes("drizzle")) {
    await sql`DROP SCHEMA drizzle CASCADE`;
    console.log("  Dropped schema: drizzle");
  }

  // Drop and recreate public schema
  await sql`DROP SCHEMA public CASCADE`;
  await sql`CREATE SCHEMA public`;
  console.log("  Dropped and recreated schema: public");

  console.log("\nDone. All data has been destroyed.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
