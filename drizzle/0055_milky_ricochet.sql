CREATE TABLE "ga_office_supplies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"item_code" text NOT NULL,
	"item_name" text NOT NULL,
	"category" text NOT NULL,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"unit" text NOT NULL,
	"reorder_point" integer DEFAULT 0 NOT NULL,
	"standard_reorder_qty" integer DEFAULT 0 NOT NULL,
	"estimated_unit_price" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ga_room_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid,
	"room_name" text NOT NULL,
	"floor_location" text DEFAULT '' NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"organizer_id" uuid NOT NULL,
	"meeting_title" text NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"attendees_internal" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attendees_external" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'Terkonfirmasi' NOT NULL,
	"booking_doc_number" text NOT NULL,
	"mom_notes" text,
	"mom_doc_number" text,
	"mom_recorded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ga_supply_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"department" text DEFAULT '' NOT NULL,
	"item_id" uuid NOT NULL,
	"qty" integer NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"request_date" text NOT NULL,
	"status" text DEFAULT 'Menunggu Approval' NOT NULL,
	"distributed_at" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ga_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_number" text NOT NULL,
	"category" text NOT NULL,
	"requester_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"priority" text DEFAULT 'Normal' NOT NULL,
	"status" text DEFAULT 'Terbuka' NOT NULL,
	"assigned_staff" text,
	"sla_hours" integer DEFAULT 24 NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ga_vehicle_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_id" uuid,
	"vehicle_name" text NOT NULL,
	"plate_number" text NOT NULL,
	"driver_type" text NOT NULL,
	"driver_name" text NOT NULL,
	"borrower_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"destination" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"start_odometer" integer DEFAULT 0 NOT NULL,
	"end_odometer" integer,
	"fuel_cost" integer,
	"status" text DEFAULT 'Disetujui' NOT NULL,
	"form_doc_number" text NOT NULL,
	"next_service_date" text,
	"tax_expiry_date" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ga_office_supplies" ADD CONSTRAINT "ga_office_supplies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_room_bookings" ADD CONSTRAINT "ga_room_bookings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_room_bookings" ADD CONSTRAINT "ga_room_bookings_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_room_bookings" ADD CONSTRAINT "ga_room_bookings_organizer_id_employees_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_supply_requests" ADD CONSTRAINT "ga_supply_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_supply_requests" ADD CONSTRAINT "ga_supply_requests_requester_id_employees_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_supply_requests" ADD CONSTRAINT "ga_supply_requests_item_id_ga_office_supplies_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."ga_office_supplies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_tickets" ADD CONSTRAINT "ga_tickets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_tickets" ADD CONSTRAINT "ga_tickets_requester_id_employees_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_vehicle_bookings" ADD CONSTRAINT "ga_vehicle_bookings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_vehicle_bookings" ADD CONSTRAINT "ga_vehicle_bookings_entity_id_company_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_vehicle_bookings" ADD CONSTRAINT "ga_vehicle_bookings_borrower_id_employees_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ga_office_supplies_tenant_code_idx" ON "ga_office_supplies" USING btree ("tenant_id","item_code");--> statement-breakpoint
CREATE UNIQUE INDEX "ga_room_bookings_tenant_doc_idx" ON "ga_room_bookings" USING btree ("tenant_id","booking_doc_number");--> statement-breakpoint
CREATE UNIQUE INDEX "ga_tickets_tenant_number_idx" ON "ga_tickets" USING btree ("tenant_id","ticket_number");--> statement-breakpoint
CREATE UNIQUE INDEX "ga_vehicle_bookings_tenant_doc_idx" ON "ga_vehicle_bookings" USING btree ("tenant_id","form_doc_number");