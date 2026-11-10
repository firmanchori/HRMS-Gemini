ALTER TABLE "ga_assets" ADD COLUMN "warranty_expiry_date" text;--> statement-breakpoint
ALTER TABLE "ga_assets" ADD COLUMN "warranty_provider" text;--> statement-breakpoint
ALTER TABLE "ga_assets" ADD COLUMN "procurement_order_id" uuid;--> statement-breakpoint
ALTER TABLE "ga_assets" ADD COLUMN "vendor_id" uuid;--> statement-breakpoint
ALTER TABLE "ga_assets" ADD COLUMN "po_number" text;--> statement-breakpoint
ALTER TABLE "ga_assets" ADD COLUMN "office_location_id" uuid;--> statement-breakpoint
ALTER TABLE "ga_assets" ADD COLUMN "returned_to_ga_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "procurement_orders" ADD COLUMN "warranty_months" integer;--> statement-breakpoint
ALTER TABLE "procurement_orders" ADD COLUMN "received_date" text;--> statement-breakpoint
ALTER TABLE "procurement_orders" ADD COLUMN "assets_generated_at" timestamp with time zone;