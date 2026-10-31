CREATE TYPE "public"."usage_resource_type" AS ENUM('user', 'entity');--> statement-breakpoint
CREATE TABLE "account_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"amount_idr" integer NOT NULL,
	"reason" text NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_subscription_id" uuid NOT NULL,
	"resource_type" "usage_resource_type" NOT NULL,
	"activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_subscriptions" ADD COLUMN "actual_users" integer;--> statement-breakpoint
ALTER TABLE "tenant_subscriptions" ADD COLUMN "actual_entities" integer;--> statement-breakpoint
ALTER TABLE "account_credits" ADD CONSTRAINT "account_credits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_usage_events" ADD CONSTRAINT "subscription_usage_events_tenant_subscription_id_tenant_subscriptions_id_fk" FOREIGN KEY ("tenant_subscription_id") REFERENCES "public"."tenant_subscriptions"("id") ON DELETE no action ON UPDATE no action;