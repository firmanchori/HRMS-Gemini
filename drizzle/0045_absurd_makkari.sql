ALTER TABLE "official_documents" ALTER COLUMN "qr_verification_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "official_documents" ALTER COLUMN "status" SET DEFAULT 'Menunggu Tanda Tangan';--> statement-breakpoint
ALTER TABLE "official_documents" ADD COLUMN "signatories" jsonb DEFAULT '[]'::jsonb NOT NULL;