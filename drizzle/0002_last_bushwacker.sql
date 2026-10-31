CREATE TYPE "public"."payment_verification_status" AS ENUM('Pending', 'Approved', 'Rejected');--> statement-breakpoint
CREATE TABLE "payment_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"amount_idr" integer NOT NULL,
	"bank_name" text NOT NULL,
	"reference_number" text NOT NULL,
	"note" text,
	"status" "payment_verification_status" DEFAULT 'Pending' NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_verifications" ADD CONSTRAINT "payment_verifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_verifications" ADD CONSTRAINT "payment_verifications_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;