ALTER TABLE "office_locations" ADD COLUMN "shape_type" text DEFAULT 'circle' NOT NULL;--> statement-breakpoint
ALTER TABLE "office_locations" ADD COLUMN "polygon_points" jsonb;