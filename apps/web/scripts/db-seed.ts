import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import * as path from "path";
import * as fs from "fs";
import { sessions, questions } from "../lib/db/schema";
import type { SeedConfig } from "../lib/db/seed-types";

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) {
  console.error("Error: POSTGRES_URL is not set. Is .env.local loaded?");
  process.exit(1);
}

const CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;

const sql = neon(POSTGRES_URL);
const db = drizzle(sql);

async function seedFromConfig(config: SeedConfig) {
  // Validate code
  if (!CODE_REGEX.test(config.code)) {
    throw new Error(`Invalid code "${config.code}" — must match ${CODE_REGEX}`);
  }

  // Check if session exists
  const existing = await db.select().from(sessions).where(eq(sessions.code, config.code)).limit(1);

  let sessionId: string;

  if (existing.length > 0) {
    sessionId = existing[0]!.id;
    // Delete existing questions (cascade deletes votes)
    await db.delete(questions).where(eq(questions.sessionId, sessionId));
    // Update session
    await db
      .update(sessions)
      .set({
        title: config.title,
        type: config.type,
        status: "lobby",
        settings: config.settings ?? null,
        currentQuestionIndex: 0,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));
  } else {
    sessionId = createId();
    await db.insert(sessions).values({
      id: sessionId,
      title: config.title,
      code: config.code,
      type: config.type,
      status: "lobby",
      settings: config.settings ?? null,
      currentQuestionIndex: 0,
    });
  }

  // Insert questions
  for (let i = 0; i < config.questions.length; i++) {
    const q = config.questions[i]!;
    await db.insert(questions).values({
      id: createId(),
      sessionId,
      orderIndex: i,
      prompt: q.prompt,
      options: q.options,
      timeLimitSeconds: q.timeLimitSeconds ?? null,
    });
  }

  console.log(
    `Seeded: ${config.title} (code: ${config.code}, ${config.questions.length} questions)`
  );
}

async function main() {
  const seedDir = path.resolve(process.cwd(), "seeds");
  const fileArg = process.argv[2];

  let files: string[];

  if (fileArg) {
    const filePath = path.join(seedDir, `${fileArg}.ts`);
    if (!fs.existsSync(filePath)) {
      console.error(`Seed file not found: ${filePath}`);
      process.exit(1);
    }
    files = [filePath];
  } else {
    if (!fs.existsSync(seedDir)) {
      console.error(`Seed directory not found: ${seedDir}`);
      process.exit(1);
    }
    files = fs
      .readdirSync(seedDir)
      .filter((f) => f.endsWith(".ts"))
      .map((f) => path.join(seedDir, f));
  }

  if (files.length === 0) {
    console.log("No seed files found.");
    return;
  }

  for (const file of files) {
    const mod = await import(file);
    const config: SeedConfig = mod.config;
    if (!config) {
      console.warn(`Skipping ${path.basename(file)} — no "config" export`);
      continue;
    }
    await seedFromConfig(config);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
