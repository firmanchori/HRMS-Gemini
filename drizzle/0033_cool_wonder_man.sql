CREATE TABLE "asset_maintenance_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_number" text NOT NULL,
	"asset_code" text NOT NULL,
	"asset_name" text NOT NULL,
	"reporter_employee_id" uuid NOT NULL,
	"issue_type" text NOT NULL,
	"priority" text NOT NULL,
	"description" text NOT NULL,
	"reported_at" text NOT NULL,
	"status" text DEFAULT 'Tiket Dibuka' NOT NULL,
	"assigned_technician" text,
	"cost" integer,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_relocation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_code" text NOT NULL,
	"asset_name" text NOT NULL,
	"from_building" text NOT NULL,
	"from_room" text NOT NULL,
	"from_employee_id" uuid,
	"to_building" text NOT NULL,
	"to_room" text NOT NULL,
	"to_employee_id" uuid,
	"relocation_date" text NOT NULL,
	"approved_by" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"trip_number" text NOT NULL,
	"employee_id" uuid NOT NULL,
	"destination_city" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"total_days" integer NOT NULL,
	"purpose" text NOT NULL,
	"transport_type" text NOT NULL,
	"estimated_cost" integer DEFAULT 0 NOT NULL,
	"per_diem_daily" integer DEFAULT 0 NOT NULL,
	"accommodation_cost" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Menunggu Approval' NOT NULL,
	"approved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ga_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"building" text NOT NULL,
	"room" text NOT NULL,
	"purchase_date" text NOT NULL,
	"purchase_price" integer DEFAULT 0 NOT NULL,
	"condition" text DEFAULT 'Baik' NOT NULL,
	"assigned_to_employee_id" uuid,
	"last_stock_opname" text NOT NULL,
	"qr_payload" text NOT NULL,
	"usage_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procurement_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" text,
	"pr_number" text NOT NULL,
	"po_number" text NOT NULL,
	"quotation_number" text,
	"contract_number" text,
	"vendor_id" uuid,
	"vendor_name" text NOT NULL,
	"item_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"estimated_cost" integer DEFAULT 0 NOT NULL,
	"requestor" text NOT NULL,
	"department" text NOT NULL,
	"status" text DEFAULT 'Pengajuan PR' NOT NULL,
	"requested_date" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"category" text NOT NULL,
	"contact_person" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"npwp" text NOT NULL,
	"rating" integer DEFAULT 3 NOT NULL,
	"address" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset_maintenance_tickets" ADD CONSTRAINT "asset_maintenance_tickets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance_tickets" ADD CONSTRAINT "asset_maintenance_tickets_reporter_employee_id_employees_id_fk" FOREIGN KEY ("reporter_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_relocation_logs" ADD CONSTRAINT "asset_relocation_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_relocation_logs" ADD CONSTRAINT "asset_relocation_logs_from_employee_id_employees_id_fk" FOREIGN KEY ("from_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_relocation_logs" ADD CONSTRAINT "asset_relocation_logs_to_employee_id_employees_id_fk" FOREIGN KEY ("to_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_trips" ADD CONSTRAINT "business_trips_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_trips" ADD CONSTRAINT "business_trips_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_assets" ADD CONSTRAINT "ga_assets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_assets" ADD CONSTRAINT "ga_assets_assigned_to_employee_id_employees_id_fk" FOREIGN KEY ("assigned_to_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_orders" ADD CONSTRAINT "procurement_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_orders" ADD CONSTRAINT "procurement_orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;