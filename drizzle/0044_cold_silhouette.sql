ALTER TABLE "employee_accounts" ADD COLUMN "totp_secret_encrypted" text;--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD COLUMN "totp_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD COLUMN "totp_backup_codes_hash" jsonb;