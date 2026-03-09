import * as readline from "readline";

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) {
  console.error("Error: POSTGRES_URL is not set. Is .env.local loaded?");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");

function isLocalPostgres(): boolean {
  return POSTGRES_URL!.includes("localhost") || POSTGRES_URL!.includes("127.0.0.1");
}

async function confirm(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await new Promise<string>((resolve) => {
    rl.question('\nThis will permanently destroy all data. Type "yes" to confirm: ', resolve);
  });
  rl.close();
  return answer.trim().toLowerCase() === "yes";
}

async function nukeWithPg() {
  const { Client } = await import("pg");
  const client = new Client({ connectionString: POSTGRES_URL });
  await client.connect();

  try {
    const schemas = ["public"];
    const drizzleCheck = await client.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'drizzle'"
    );
    if (drizzleCheck.rows.length > 0) schemas.push("drizzle");

    const tables = await client.query(
      "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public', 'drizzle') ORDER BY table_schema, table_name"
    );

    printStatus(schemas, tables.rows);
    if (dryRun) return;
    if (!(await confirm())) return;

    console.log("\nDropping schemas...");
    if (schemas.includes("drizzle")) {
      await client.query("DROP SCHEMA drizzle CASCADE");
      console.log("  Dropped schema: drizzle");
    }
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
    console.log("  Dropped and recreated schema: public");
    console.log("\nDone. All data has been destroyed.");
  } finally {
    await client.end();
  }
}

async function nukeWithNeon() {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(POSTGRES_URL!);

  const schemas = ["public"];
  const drizzleCheck = await sql`
    SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'drizzle'
  `;
  if (drizzleCheck.length > 0) schemas.push("drizzle");

  const tables = await sql`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema IN ('public', 'drizzle')
    ORDER BY table_schema, table_name
  `;

  printStatus(schemas, tables);
  if (dryRun) return;
  if (!(await confirm())) return;

  console.log("\nDropping schemas...");
  if (schemas.includes("drizzle")) {
    await sql`DROP SCHEMA drizzle CASCADE`;
    console.log("  Dropped schema: drizzle");
  }
  await sql`DROP SCHEMA public CASCADE`;
  await sql`CREATE SCHEMA public`;
  console.log("  Dropped and recreated schema: public");
  console.log("\nDone. All data has been destroyed.");
}

function printStatus(schemas: string[], tables: Record<string, string>[]) {
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
  }
}

async function main() {
  if (isLocalPostgres()) {
    await nukeWithPg();
  } else {
    await nukeWithNeon();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
