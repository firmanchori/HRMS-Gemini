CREATE TABLE "payroll_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"period_key" text NOT NULL,
	"label" text NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"generated_at" timestamp with time zone,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"disbursed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reimbursement_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"claim_number" text NOT NULL,
	"category" text NOT NULL,
	"amount" integer NOT NULL,
	"approved_amount" integer,
	"description" text NOT NULL,
	"receipt_date" text NOT NULL,
	"receipt_number" text,
	"proof_url" text,
	"status" text DEFAULT 'Menunggu Review' NOT NULL,
	"process_in_payroll" boolean DEFAULT true NOT NULL,
	"processed_period" text,
	"approved_by" text,
	"notes" text,
	"approval_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reimbursement_claims" ADD CONSTRAINT "reimbursement_claims_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reimbursement_claims" ADD CONSTRAINT "reimbursement_claims_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_periods_tenant_key_idx" ON "payroll_periods" USING btree ("tenant_id","period_key");--> statement-breakpoint
CREATE UNIQUE INDEX "reimbursement_claims_tenant_number_idx" ON "reimbursement_claims" USING btree ("tenant_id","claim_number");