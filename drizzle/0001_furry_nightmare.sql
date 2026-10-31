CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"base_price_idr" integer DEFAULT 0 NOT NULL,
	"price_per_user_idr" integer DEFAULT 0 NOT NULL,
	"price_per_entity_idr" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "modules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "is_custom" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "max_entities" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "discount_percent" integer DEFAULT 0 NOT NULL;