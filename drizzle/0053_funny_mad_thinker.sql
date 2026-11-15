CREATE TABLE "thr_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"occasion" text NOT NULL,
	"payment_date" text NOT NULL,
	"tenure_months" integer DEFAULT 0 NOT NULL,
	"base_wage" integer DEFAULT 0 NOT NULL,
	"gross_amount" integer DEFAULT 0 NOT NULL,
	"ter_category" text DEFAULT 'TER A' NOT NULL,
	"ter_rate_percent" double precision DEFAULT 0 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"net_amount" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "thr_payments" ADD CONSTRAINT "thr_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thr_payments" ADD CONSTRAINT "thr_payments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "thr_payments_tenant_year_emp_idx" ON "thr_payments" USING btree ("tenant_id","year","employee_id");