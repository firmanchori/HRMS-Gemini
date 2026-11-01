CREATE TYPE "public"."entity_relation_type" AS ENUM('resmi', 'administratif');--> statement-breakpoint
CREATE TYPE "public"."entity_status" AS ENUM('Aktif', 'Nonaktif');--> statement-breakpoint
CREATE TYPE "public"."grading_scheme" AS ENUM('single', 'broadbanding');--> statement-breakpoint
CREATE TYPE "public"."org_change_proposal_status" AS ENUM('Draft', 'PendingApproval', 'Approved', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."org_node_relation_type" AS ENUM('struktural', 'administratif');--> statement-breakpoint
CREATE TABLE "company_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"division_id" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"head_title" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_divisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"head_title" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"parent_entity_id" uuid,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"email_domain" text,
	"relation_type" "entity_relation_type" DEFAULT 'resmi' NOT NULL,
	"use_department_level" boolean DEFAULT true NOT NULL,
	"npwp" text,
	"address" text,
	"city" text,
	"nik_pattern" text,
	"doc_prefix" text,
	"status" "entity_status" DEFAULT 'Aktif' NOT NULL,
	"created_by_entity_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_closure" (
	"ancestor_entity_id" uuid NOT NULL,
	"descendant_entity_id" uuid NOT NULL,
	"depth" integer NOT NULL,
	CONSTRAINT "entity_closure_ancestor_entity_id_descendant_entity_id_pk" PRIMARY KEY("ancestor_entity_id","descendant_entity_id")
);
--> statement-breakpoint
CREATE TABLE "grade_salary_ranges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid,
	"grade_code" text NOT NULL,
	"grade_name" text NOT NULL,
	"min_salary" integer,
	"mid_salary" integer,
	"max_salary" integer,
	"single_value_salary" integer,
	"effective_date" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_job_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"default_level" integer DEFAULT 5 NOT NULL,
	"division_id" uuid,
	"department_id" uuid,
	"job_family" text,
	"job_grade" text,
	"min_grade" text,
	"max_grade" text,
	"grading_scheme" "grading_scheme" DEFAULT 'single' NOT NULL,
	"description" text,
	"requirements" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_change_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"official_letter_number" text,
	"changes" jsonb NOT NULL,
	"status" "org_change_proposal_status" DEFAULT 'Draft' NOT NULL,
	"proposed_by_user_id" uuid NOT NULL,
	"approved_by_user_id" uuid,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_structure_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"title" text NOT NULL,
	"division_id" uuid,
	"department_id" uuid,
	"code" text,
	"job_grade" text,
	"description" text,
	"reports_to_id" uuid,
	"relation_type" "org_node_relation_type" DEFAULT 'struktural' NOT NULL,
	"is_vacant" boolean DEFAULT true NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"master_job_position_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_structure_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"proposal_id" uuid,
	"divisions" jsonb NOT NULL,
	"departments" jsonb NOT NULL,
	"org_nodes" jsonb NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_departments" ADD CONSTRAINT "company_departments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_departments" ADD CONSTRAINT "company_departments_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_departments" ADD CONSTRAINT "company_departments_division_id_company_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."company_divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_divisions" ADD CONSTRAINT "company_divisions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_divisions" ADD CONSTRAINT "company_divisions_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_entities" ADD CONSTRAINT "company_entities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_entities" ADD CONSTRAINT "company_entities_parent_entity_id_company_entities_id_fk" FOREIGN KEY ("parent_entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_closure" ADD CONSTRAINT "entity_closure_ancestor_entity_id_company_entities_id_fk" FOREIGN KEY ("ancestor_entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_closure" ADD CONSTRAINT "entity_closure_descendant_entity_id_company_entities_id_fk" FOREIGN KEY ("descendant_entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_salary_ranges" ADD CONSTRAINT "grade_salary_ranges_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_salary_ranges" ADD CONSTRAINT "grade_salary_ranges_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_job_positions" ADD CONSTRAINT "master_job_positions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_job_positions" ADD CONSTRAINT "master_job_positions_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_job_positions" ADD CONSTRAINT "master_job_positions_division_id_company_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."company_divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_job_positions" ADD CONSTRAINT "master_job_positions_department_id_company_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."company_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_change_proposals" ADD CONSTRAINT "org_change_proposals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_change_proposals" ADD CONSTRAINT "org_change_proposals_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_change_proposals" ADD CONSTRAINT "org_change_proposals_proposed_by_user_id_users_id_fk" FOREIGN KEY ("proposed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_change_proposals" ADD CONSTRAINT "org_change_proposals_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_structure_nodes" ADD CONSTRAINT "org_structure_nodes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_structure_nodes" ADD CONSTRAINT "org_structure_nodes_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_structure_nodes" ADD CONSTRAINT "org_structure_nodes_division_id_company_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."company_divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_structure_nodes" ADD CONSTRAINT "org_structure_nodes_department_id_company_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."company_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_structure_nodes" ADD CONSTRAINT "org_structure_nodes_reports_to_id_org_structure_nodes_id_fk" FOREIGN KEY ("reports_to_id") REFERENCES "public"."org_structure_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_structure_nodes" ADD CONSTRAINT "org_structure_nodes_master_job_position_id_master_job_positions_id_fk" FOREIGN KEY ("master_job_position_id") REFERENCES "public"."master_job_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_structure_snapshots" ADD CONSTRAINT "org_structure_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_structure_snapshots" ADD CONSTRAINT "org_structure_snapshots_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_structure_snapshots" ADD CONSTRAINT "org_structure_snapshots_proposal_id_org_change_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."org_change_proposals"("id") ON DELETE no action ON UPDATE no action;