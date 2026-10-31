CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" text NOT NULL,
	"account_holder_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_verifications" ADD COLUMN "bank_account_id" uuid;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "display_includes_user_pricing" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "display_includes_entity_pricing" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "display_price_idr" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_verifications" ADD CONSTRAINT "payment_verifications_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;