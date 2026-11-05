CREATE TABLE "audit_trail_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" text NOT NULL,
	"actor_name" text NOT NULL,
	"actor_role" text NOT NULL,
	"module" text NOT NULL,
	"action" text NOT NULL,
	"record_id" text NOT NULL,
	"changes_summary" text NOT NULL,
	"details" jsonb
);
--> statement-breakpoint
ALTER TABLE "audit_trail_entries" ADD CONSTRAINT "audit_trail_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_trail_entries" ADD CONSTRAINT "audit_trail_entries_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;