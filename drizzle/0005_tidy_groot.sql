CREATE TYPE "public"."discount_scheme_type" AS ENUM('duration_months', 'user_count', 'entity_count');--> statement-breakpoint
CREATE TABLE "affiliate_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"amount_paid_idr" integer NOT NULL,
	"commission_idr" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"code" text NOT NULL,
	"affiliate_name" text NOT NULL,
	"customer_discount_percent" integer NOT NULL,
	"commission_percent" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "affiliates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "discount_schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"scheme_type" "discount_scheme_type" NOT NULL,
	"label" text NOT NULL,
	"tiers" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "plan_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "reference_monthly_price_idr" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "permanent_discount_percent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "permanent_discount_reason" text;--> statement-breakpoint
ALTER TABLE "affiliate_usages" ADD CONSTRAINT "affiliate_usages_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_usages" ADD CONSTRAINT "affiliate_usages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_schemes" ADD CONSTRAINT "discount_schemes_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;