import { pgTable, text, integer, jsonb, timestamp, unique, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // "poll" | "quiz" | "roast"
  status: text("status").notNull().default("draft"), // "draft" | "lobby" | "active" | "finished"
  currentQuestionIndex: integer("current_question_index").default(0),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessionsRelations = relations(sessions, ({ many }) => ({
  questions: many(questions),
}));

export const questions = pgTable(
  "questions",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull(),
    prompt: text("prompt").notNull(),
    options: jsonb("options").notNull().$type<string[]>(),
    timeLimitSeconds: integer("time_limit_seconds"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("questions_session_id_order_idx").on(t.sessionId, t.orderIndex)]
);

export const questionsRelations = relations(questions, ({ one }) => ({
  session: one(sessions, { fields: [questions.sessionId], references: [sessions.id] }),
}));

export const votes = pgTable(
  "votes",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    voterId: text("voter_id").notNull(),
    value: text("value").notNull(),
    submittedAt: timestamp("submitted_at").defaultNow(),
  },
  (t) => [unique().on(t.questionId, t.voterId), index("votes_question_id_idx").on(t.questionId)]
);
