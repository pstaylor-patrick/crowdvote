ALTER TABLE "votes" ADD COLUMN "fingerprint" text;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_question_id_fingerprint_unique" UNIQUE("question_id","fingerprint");