CREATE TYPE "public"."office_location_type" AS ENUM('Kantor Pusat', 'Kantor Cabang', 'Gudang', 'Workshop', 'Site Operasional');--> statement-breakpoint
CREATE TABLE "office_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" "office_location_type" DEFAULT 'Kantor Cabang' NOT NULL,
	"address" text,
	"city" text,
	"latitude" double precision,
	"longitude" double precision,
	"radius_meters" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "office_locations" ADD CONSTRAINT "office_locations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_locations" ADD CONSTRAINT "office_locations_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;