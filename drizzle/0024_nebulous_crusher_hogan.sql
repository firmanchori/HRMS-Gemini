CREATE TYPE "public"."contract_recommendation" AS ENUM('Perpanjang PKWT', 'Alih Status PKWTT (Tetap)', 'Tidak Diperpanjang');--> statement-breakpoint
CREATE TYPE "public"."contract_review_status" AS ENUM('Menunggu Approval', 'Disetujui', 'Ditolak');--> statement-breakpoint
CREATE TYPE "public"."probation_recommendation" AS ENUM('Lulus', 'Perpanjang Probation', 'Tidak Lulus');--> statement-breakpoint
CREATE TYPE "public"."probation_status" AS ENUM('Draft', 'Menunggu Approval', 'Disetujui', 'Ditolak');--> statement-breakpoint
CREATE TABLE "contract_renewal_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"current_contract_end" timestamp with time zone NOT NULL,
	"recommendation" "contract_recommendation" NOT NULL,
	"new_duration_months" integer,
	"notes" text,
	"status" "contract_review_status" DEFAULT 'Menunggu Approval' NOT NULL,
	"approved_by" text,
	"new_contract_doc_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "probation_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"supervisor_id" uuid,
	"evaluation_date" timestamp with time zone DEFAULT now() NOT NULL,
	"technical_skill_score" integer NOT NULL,
	"discipline_score" integer NOT NULL,
	"teamwork_score" integer NOT NULL,
	"initiative_score" integer NOT NULL,
	"overall_score" integer NOT NULL,
	"recommendation" "probation_recommendation" NOT NULL,
	"extension_duration_months" integer,
	"notes" text,
	"status" "probation_status" DEFAULT 'Draft' NOT NULL,
	"approved_by" text,
	"sk_doc_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_module_settings" (
	"tenant_id" uuid NOT NULL,
	"module_key" text NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_module_settings_tenant_id_module_key_pk" PRIMARY KEY("tenant_id","module_key")
);
--> statement-breakpoint
ALTER TABLE "contract_renewal_reviews" ADD CONSTRAINT "contract_renewal_reviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_renewal_reviews" ADD CONSTRAINT "contract_renewal_reviews_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "probation_evaluations" ADD CONSTRAINT "probation_evaluations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "probation_evaluations" ADD CONSTRAINT "probation_evaluations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "probation_evaluations" ADD CONSTRAINT "probation_evaluations_supervisor_id_employees_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_module_settings" ADD CONSTRAINT "tenant_module_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;