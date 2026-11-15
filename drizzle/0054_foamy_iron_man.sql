CREATE TABLE "employee_account_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_account_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_account_tokens" ADD CONSTRAINT "employee_account_tokens_employee_account_id_employee_accounts_id_fk" FOREIGN KEY ("employee_account_id") REFERENCES "public"."employee_accounts"("id") ON DELETE no action ON UPDATE no action;