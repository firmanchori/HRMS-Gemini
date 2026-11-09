CREATE TABLE "probation_evaluation_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"categories" jsonb NOT NULL,
	"valid_from" text NOT NULL,
	"valid_until" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "probation_evaluations" ALTER COLUMN "technical_skill_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "probation_evaluations" ALTER COLUMN "discipline_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "probation_evaluations" ALTER COLUMN "teamwork_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "probation_evaluations" ALTER COLUMN "initiative_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "probation_evaluations" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "probation_evaluations" ADD COLUMN "category_scores" jsonb;--> statement-breakpoint
ALTER TABLE "probation_evaluation_templates" ADD CONSTRAINT "probation_evaluation_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "probation_evaluations" ADD CONSTRAINT "probation_evaluations_template_id_probation_evaluation_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."probation_evaluation_templates"("id") ON DELETE no action ON UPDATE no action;