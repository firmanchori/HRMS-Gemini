ALTER TABLE "contract_renewal_reviews" ADD COLUMN "new_salary" integer;--> statement-breakpoint
ALTER TABLE "contract_renewal_reviews" ADD COLUMN "effective_date" text;--> statement-breakpoint
ALTER TABLE "contract_renewal_reviews" ADD COLUMN "applied_at" timestamp with time zone;