ALTER TABLE "job_requisitions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "job_requisitions" ALTER COLUMN "status" SET DEFAULT 'Draft'::text;--> statement-breakpoint
DROP TYPE "public"."job_requisition_status";--> statement-breakpoint
CREATE TYPE "public"."job_requisition_status" AS ENUM('Draft', 'Menunggu Approval', 'Disetujui', 'Ditolak', 'Dibatalkan', 'Dicabut (Retracted)');--> statement-breakpoint
ALTER TABLE "job_requisitions" ALTER COLUMN "status" SET DEFAULT 'Draft'::"public"."job_requisition_status";--> statement-breakpoint
ALTER TABLE "job_requisitions" ALTER COLUMN "status" SET DATA TYPE "public"."job_requisition_status" USING "status"::"public"."job_requisition_status";--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD COLUMN "details" jsonb DEFAULT '{}'::jsonb NOT NULL;