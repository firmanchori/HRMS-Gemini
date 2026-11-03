CREATE TYPE "public"."org_snapshot_change_type" AS ENUM('restrukturisasi', 'modifikasi');--> statement-breakpoint
ALTER TABLE "org_structure_snapshots" ADD COLUMN "positions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "org_structure_snapshots" ADD COLUMN "sk_doc_number" text;--> statement-breakpoint
ALTER TABLE "org_structure_snapshots" ADD COLUMN "effective_date" text;--> statement-breakpoint
ALTER TABLE "org_structure_snapshots" ADD COLUMN "sk_doc_file_name" text;--> statement-breakpoint
ALTER TABLE "org_structure_snapshots" ADD COLUMN "change_type" "org_snapshot_change_type";--> statement-breakpoint
ALTER TABLE "org_structure_snapshots" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "org_structure_snapshots" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "org_structure_snapshots" ADD CONSTRAINT "org_structure_snapshots_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;