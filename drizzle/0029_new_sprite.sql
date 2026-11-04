CREATE TABLE "employee_salary_component_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"effective_date" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"period" text NOT NULL,
	"basic_salary" integer DEFAULT 0 NOT NULL,
	"allowances" integer DEFAULT 0 NOT NULL,
	"overtime_pay" integer DEFAULT 0 NOT NULL,
	"reimbursement" integer DEFAULT 0 NOT NULL,
	"thr_bonus" integer DEFAULT 0 NOT NULL,
	"gross_pay" integer DEFAULT 0 NOT NULL,
	"bpjs_kes_company" integer DEFAULT 0 NOT NULL,
	"bpjs_kes_employee" integer DEFAULT 0 NOT NULL,
	"bpjs_tk_company" integer DEFAULT 0 NOT NULL,
	"bpjs_tk_employee" integer DEFAULT 0 NOT NULL,
	"pph21_ter_category" text DEFAULT 'TER A' NOT NULL,
	"pph21_rate_percent" double precision DEFAULT 0 NOT NULL,
	"pph21_amount" integer DEFAULT 0 NOT NULL,
	"loan_deduction" integer DEFAULT 0 NOT NULL,
	"late_deduction" integer DEFAULT 0 NOT NULL,
	"unpaid_leave_deduction" integer,
	"severance_pay" integer,
	"total_deductions" integer DEFAULT 0 NOT NULL,
	"net_pay" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"paid_date" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"calculation_basis" text NOT NULL,
	"default_value" integer DEFAULT 0 NOT NULL,
	"is_taxable" boolean DEFAULT true NOT NULL,
	"is_bpjs_base" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_salary_component_assignments" ADD CONSTRAINT "employee_salary_component_assignments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_component_assignments" ADD CONSTRAINT "employee_salary_component_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_component_assignments" ADD CONSTRAINT "employee_salary_component_assignments_component_id_salary_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."salary_components"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_components" ADD CONSTRAINT "salary_components_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_components" ADD CONSTRAINT "salary_components_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;