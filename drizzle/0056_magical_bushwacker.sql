CREATE TABLE "ga_bast_handovers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"bast_number" text NOT NULL,
	"handover_date" text NOT NULL,
	"handover_category" text NOT NULL,
	"ga_officer_name" text NOT NULL,
	"ga_officer_role" text NOT NULL,
	"recipient_employee_id" uuid NOT NULL,
	"recipient_name" text NOT NULL,
	"recipient_role" text NOT NULL,
	"swap_party_a_employee_id" uuid,
	"building" text NOT NULL,
	"room_or_area" text NOT NULL,
	"status" text DEFAULT 'Aktif / Diserahterimakan' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ga_bast_handovers" ADD CONSTRAINT "ga_bast_handovers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_bast_handovers" ADD CONSTRAINT "ga_bast_handovers_recipient_employee_id_employees_id_fk" FOREIGN KEY ("recipient_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ga_bast_handovers" ADD CONSTRAINT "ga_bast_handovers_swap_party_a_employee_id_employees_id_fk" FOREIGN KEY ("swap_party_a_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ga_bast_tenant_number_idx" ON "ga_bast_handovers" USING btree ("tenant_id","bast_number");