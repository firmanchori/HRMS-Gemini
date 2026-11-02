CREATE TABLE "approval_delegations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"principal_id" text NOT NULL,
	"substitute_id" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"reason" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category" text NOT NULL,
	"reference_id" text NOT NULL,
	"title" text NOT NULL,
	"requester_id" text NOT NULL,
	"department" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deadline_at" timestamp with time zone,
	"level" integer DEFAULT 1 NOT NULL,
	"total_levels" integer DEFAULT 1 NOT NULL,
	"assigned_approver_role" text NOT NULL,
	"assigned_approver_id" text,
	"substitute_approver_id" text,
	"status" text DEFAULT 'Menunggu' NOT NULL,
	"amount" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_items" ADD CONSTRAINT "approval_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;