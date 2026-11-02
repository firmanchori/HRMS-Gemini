CREATE TABLE "onboarding_checklist_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"target_department" text NOT NULL,
	"verification_type" text NOT NULL,
	"action_type" text,
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"description" text,
	"sub_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onboarding_checklist_templates" ADD CONSTRAINT "onboarding_checklist_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;