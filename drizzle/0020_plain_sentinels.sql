ALTER TABLE "candidates" ALTER COLUMN "stage" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "candidates" ALTER COLUMN "stage" SET DEFAULT 'Lamaran Masuk';--> statement-breakpoint
DROP TYPE "public"."recruitment_stage";