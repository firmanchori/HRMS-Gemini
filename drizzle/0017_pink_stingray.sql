CREATE TYPE "public"."employment_status" AS ENUM('Aktif', 'Cuti Panjang', 'Resign', 'Diberhentikan', 'Pensiun');--> statement-breakpoint
CREATE TYPE "public"."job_requisition_status" AS ENUM('Draft', 'PendingApproval', 'Approved', 'Rejected', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."job_requisition_type" AS ENUM('Baru', 'Penggantian');--> statement-breakpoint
CREATE TABLE "document_signatory_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"role_label" text NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "education_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"nik" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"photo_url" text,
	"position_id" uuid,
	"division_id" uuid,
	"department_id" uuid,
	"org_node_id" uuid,
	"employment_status" "employment_status" DEFAULT 'Aktif' NOT NULL,
	"join_date" timestamp with time zone,
	"resign_date" timestamp with time zone,
	"resign_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fields_of_study" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_requisitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"office_location_id" uuid,
	"division_id" uuid,
	"department_id" uuid,
	"position_id" uuid,
	"requested_by_user_id" uuid NOT NULL,
	"requisition_type" "job_requisition_type" DEFAULT 'Baru' NOT NULL,
	"replacement_employee_id" uuid,
	"headcount" integer DEFAULT 1 NOT NULL,
	"education_level_id" uuid,
	"fields_of_study_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"min_experience_years" integer DEFAULT 0 NOT NULL,
	"knockout_criteria" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scored_criteria" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"signatories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "job_requisition_status" DEFAULT 'Draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_signatory_configs" ADD CONSTRAINT "document_signatory_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_levels" ADD CONSTRAINT "education_levels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_position_id_master_job_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."master_job_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_division_id_company_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."company_divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_company_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."company_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_org_node_id_org_structure_nodes_id_fk" FOREIGN KEY ("org_node_id") REFERENCES "public"."org_structure_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fields_of_study" ADD CONSTRAINT "fields_of_study_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_office_location_id_office_locations_id_fk" FOREIGN KEY ("office_location_id") REFERENCES "public"."office_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_division_id_company_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."company_divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_department_id_company_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."company_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_position_id_master_job_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."master_job_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_replacement_employee_id_employees_id_fk" FOREIGN KEY ("replacement_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_education_level_id_education_levels_id_fk" FOREIGN KEY ("education_level_id") REFERENCES "public"."education_levels"("id") ON DELETE no action ON UPDATE no action;