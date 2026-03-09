CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"order_index" integer NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb NOT NULL,
	"time_limit_seconds" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"current_question_index" integer DEFAULT 0,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sessions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"voter_id" text NOT NULL,
	"value" text NOT NULL,
	"submitted_at" timestamp DEFAULT now(),
	CONSTRAINT "votes_question_id_voter_id_unique" UNIQUE("question_id","voter_id")
);
--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "questions_session_id_order_idx" ON "questions" USING btree ("session_id","order_index");--> statement-breakpoint
CREATE INDEX "votes_question_id_idx" ON "votes" USING btree ("question_id");