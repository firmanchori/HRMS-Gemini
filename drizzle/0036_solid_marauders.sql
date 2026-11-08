CREATE TABLE "document_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"numbering_pattern" text NOT NULL,
	"paper_size" text,
	"letter_head_title" text NOT NULL,
	"letter_head_address" text NOT NULL,
	"letter_head_npwp" text,
	"letter_head_phone" text,
	"letter_head_email" text,
	"default_body" text NOT NULL,
	"show_qr_signature" boolean DEFAULT true NOT NULL,
	"signee_title" text NOT NULL,
	"signee_role" text NOT NULL,
	"source_type" text,
	"file_name" text,
	"file_size" text,
	"uploaded_at" text,
	"raw_html_template" text,
	"extracted_placeholders" jsonb,
	"kop_position" text,
	"qr_position" text,
	"footer_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enps_surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"period" text NOT NULL,
	"title" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"responses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_responses" integer DEFAULT 0 NOT NULL,
	"promoters" integer DEFAULT 0 NOT NULL,
	"passives" integer DEFAULT 0 NOT NULL,
	"detractors" integer DEFAULT 0 NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "official_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"document_number" text NOT NULL,
	"type" text NOT NULL,
	"template_id" uuid,
	"title" text NOT NULL,
	"target_employee_id" uuid,
	"issue_date" text NOT NULL,
	"signee_name" text NOT NULL,
	"signee_role" text NOT NULL,
	"qr_verification_url" text NOT NULL,
	"status" text DEFAULT 'Resmi Diterbitkan' NOT NULL,
	"content_preview" text NOT NULL,
	"rendered_html" text,
	"is_from_docx_template" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"vendor_name" text NOT NULL,
	"po_number" text NOT NULL,
	"invoice_number" text NOT NULL,
	"invoice_date" text NOT NULL,
	"due_date" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Belum Bill' NOT NULL,
	"paid_date" text,
	"payment_method" text,
	"tax_invoice_number" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enps_surveys" ADD CONSTRAINT "enps_surveys_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "official_documents" ADD CONSTRAINT "official_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "official_documents" ADD CONSTRAINT "official_documents_template_id_document_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."document_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "official_documents" ADD CONSTRAINT "official_documents_target_employee_id_employees_id_fk" FOREIGN KEY ("target_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;