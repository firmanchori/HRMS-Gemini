CREATE TABLE "offboarding_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"separation_type" text NOT NULL,
	"request_date" text NOT NULL,
	"effective_date" text NOT NULL,
	"handover_completed" boolean DEFAULT false NOT NULL,
	"asset_returned" boolean DEFAULT false NOT NULL,
	"finance_cleared" boolean DEFAULT false NOT NULL,
	"severance_pay" integer DEFAULT 0 NOT NULL,
	"parklaring_issued" boolean DEFAULT false NOT NULL,
	"parklaring_number" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offboarding_records" ADD CONSTRAINT "offboarding_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_records" ADD CONSTRAINT "offboarding_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;