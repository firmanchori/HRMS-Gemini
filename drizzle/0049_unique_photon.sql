CREATE TABLE "personalia_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'Draf' NOT NULL,
	"previous_position" text,
	"previous_department" text,
	"previous_grade" text,
	"previous_salary" integer DEFAULT 0 NOT NULL,
	"previous_allowance" integer,
	"previous_org_node_id" uuid,
	"previous_entity_id" uuid,
	"new_org_node_id" uuid,
	"new_grade" text,
	"new_salary" integer,
	"new_position_allowance" integer,
	"new_fixed_allowance" integer,
	"new_branch_location" text,
	"new_entity_id" uuid,
	"mutation_type" text,
	"personal_data_updates" jsonb,
	"contract_duration_months" integer,
	"contract_end_date" text,
	"acting_role_expiry_date" text,
	"permanent_appointment_date" text,
	"disciplinary_level" text,
	"effective_date" text NOT NULL,
	"letter_number" text NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"signatories" jsonb,
	"systemic_impact" jsonb,
	"approval_item_id" uuid,
	"document_id" uuid,
	"approved_by" text,
	"applied_at" timestamp with time zone,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "personalia_actions" ADD CONSTRAINT "personalia_actions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personalia_actions" ADD CONSTRAINT "personalia_actions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personalia_actions" ADD CONSTRAINT "personalia_actions_new_org_node_id_org_structure_nodes_id_fk" FOREIGN KEY ("new_org_node_id") REFERENCES "public"."org_structure_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personalia_actions" ADD CONSTRAINT "personalia_actions_new_entity_id_company_entities_id_fk" FOREIGN KEY ("new_entity_id") REFERENCES "public"."company_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "personalia_actions_tenant_letter_idx" ON "personalia_actions" USING btree ("tenant_id","letter_number");