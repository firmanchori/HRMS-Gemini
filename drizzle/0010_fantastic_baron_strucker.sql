CREATE TYPE "public"."invoice_status" AS ENUM('Pending', 'Paid', 'Cancelled');--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"line_items" jsonb NOT NULL,
	"total_amount_idr" integer NOT NULL,
	"status" "invoice_status" DEFAULT 'Pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;