ALTER TABLE "attendance_records" ADD COLUMN "clock_in_lat" double precision;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "clock_in_lng" double precision;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "clock_in_inside_radius" boolean;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "clock_out_lat" double precision;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "clock_out_lng" double precision;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "clock_out_inside_radius" boolean;