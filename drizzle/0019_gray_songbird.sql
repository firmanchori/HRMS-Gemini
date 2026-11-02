CREATE TYPE "public"."job_vacancy_status" AS ENUM('Buka', 'Ditutup');--> statement-breakpoint
CREATE TYPE "public"."onboarding_status" AS ENUM('In Progress', 'Completed', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."onboarding_type" AS ENUM('via_recruitment', 'direct');--> statement-breakpoint
CREATE TYPE "public"."recruitment_stage" AS ENUM('Lamaran Masuk', 'Screening', 'Tes/Assessment', 'Interview', 'Medical Check-Up', 'Offering', 'Hired', 'Ditolak', 'Mundur');--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"job_vacancy_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"stage" "recruitment_stage" DEFAULT 'Lamaran Masuk' NOT NULL,
	"applied_date" timestamp with time zone DEFAULT now() NOT NULL,
	"ai_match_score" integer,
	"test_score" integer,
	"interview_score" integer,
	"offered_salary" integer,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_vacancies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"job_requisition_id" uuid,
	"title" text NOT NULL,
	"openings" integer DEFAULT 1 NOT NULL,
	"status" "job_vacancy_status" DEFAULT 'Buka' NOT NULL,
	"posted_date" timestamp with time zone DEFAULT now() NOT NULL,
	"target_close_date" timestamp with time zone,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_processes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"type" "onboarding_type" DEFAULT 'direct' NOT NULL,
	"candidate_id" uuid,
	"employee_name" text NOT NULL,
	"email" text,
	"phone" text,
	"position" text,
	"department_id" uuid,
	"join_date" timestamp with time zone,
	"basic_salary" integer,
	"contract_doc_number" text,
	"status" "onboarding_status" DEFAULT 'In Progress' NOT NULL,
	"created_employee_id" uuid,
	"tasks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_job_vacancy_id_job_vacancies_id_fk" FOREIGN KEY ("job_vacancy_id") REFERENCES "public"."job_vacancies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_vacancies" ADD CONSTRAINT "job_vacancies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_vacancies" ADD CONSTRAINT "job_vacancies_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_vacancies" ADD CONSTRAINT "job_vacancies_job_requisition_id_job_requisitions_id_fk" FOREIGN KEY ("job_requisition_id") REFERENCES "public"."job_requisitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_processes" ADD CONSTRAINT "onboarding_processes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_processes" ADD CONSTRAINT "onboarding_processes_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_processes" ADD CONSTRAINT "onboarding_processes_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_processes" ADD CONSTRAINT "onboarding_processes_department_id_company_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."company_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_processes" ADD CONSTRAINT "onboarding_processes_created_employee_id_employees_id_fk" FOREIGN KEY ("created_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;