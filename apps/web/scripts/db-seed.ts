import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import * as path from "path";
import * as fs from "fs";
import { db } from "../lib/db";
import { sessions, questions } from "../lib/db/schema";
import type { SeedConfig } from "../lib/db/seed-types";

if (!process.env.POSTGRES_URL) {
  console.error("Error: POSTGRES_URL is not set. Is .env.local loaded?");
  process.exit(1);
}

const CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;

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

function collectSeedFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => path.join(dir, f));
}

async function main() {
  const localSeedDir = path.resolve(process.cwd(), "seeds");
  const rootSeedDir = path.resolve(process.cwd(), "../../seeds");
  const fileArg = process.argv[2];

  let files: string[];

  if (fileArg) {
    const localPath = path.join(localSeedDir, `${fileArg}.ts`);
    const rootPath = path.join(rootSeedDir, `${fileArg}.ts`);
    const filePath = fs.existsSync(localPath)
      ? localPath
      : fs.existsSync(rootPath)
        ? rootPath
        : null;
    if (!filePath) {
      console.error(`Seed file not found: ${fileArg}.ts`);
      process.exit(1);
    }
    files = [filePath];
  } else {
    const seen = new Set<string>();
    files = [...collectSeedFiles(localSeedDir), ...collectSeedFiles(rootSeedDir)].filter((f) => {
      const name = path.basename(f);
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
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
