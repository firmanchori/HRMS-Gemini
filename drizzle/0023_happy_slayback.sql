ALTER TABLE "employees" ADD COLUMN "full_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "avatar" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employment_type" text DEFAULT 'Kontrak' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "manager_id" uuid;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "candidate_id" uuid;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "status" text DEFAULT 'Aktif' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "basic_salary" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "details" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "photo_url";--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "employment_status";--> statement-breakpoint
DROP TYPE "public"."employment_status";