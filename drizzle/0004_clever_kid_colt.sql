CREATE TYPE "public"."mailer_provider" AS ENUM('resend', 'smtp');--> statement-breakpoint
CREATE TABLE "email_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"provider" "mailer_provider" DEFAULT 'resend' NOT NULL,
	"from_name" text NOT NULL,
	"from_email" text NOT NULL,
	"resend_api_key_encrypted" text,
	"smtp_host" text,
	"smtp_port" integer,
	"smtp_username" text,
	"smtp_password_encrypted" text,
	"smtp_secure" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_configs" ADD CONSTRAINT "email_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;