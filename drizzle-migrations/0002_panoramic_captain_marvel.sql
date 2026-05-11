ALTER TABLE "contact_imports" ALTER COLUMN "errors" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "contact_imports" ADD COLUMN "cursor_byte" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_imports" ADD COLUMN "total_byte_size" bigint DEFAULT 0 NOT NULL;