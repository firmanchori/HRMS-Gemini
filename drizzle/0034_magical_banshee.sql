CREATE TABLE "company_calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"type" text NOT NULL,
	"deducts_leave_bucket" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_definitions" (
	"tenant_id" uuid NOT NULL,
	"id" text NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"badge_class" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_definitions_tenant_id_id_pk" PRIMARY KEY("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "role_permission_entries" (
	"tenant_id" uuid NOT NULL,
	"module_key" text NOT NULL,
	"role_key" text NOT NULL,
	"view" boolean DEFAULT false NOT NULL,
	"create" boolean DEFAULT false NOT NULL,
	"edit" boolean DEFAULT false NOT NULL,
	"delete" boolean DEFAULT false NOT NULL,
	"approve" boolean DEFAULT false NOT NULL,
	"export" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permission_entries_tenant_id_module_key_role_key_pk" PRIMARY KEY("tenant_id","module_key","role_key")
);
--> statement-breakpoint
ALTER TABLE "company_calendar_events" ADD CONSTRAINT "company_calendar_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_calendar_events" ADD CONSTRAINT "company_calendar_events_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_definitions" ADD CONSTRAINT "role_definitions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permission_entries" ADD CONSTRAINT "role_permission_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;