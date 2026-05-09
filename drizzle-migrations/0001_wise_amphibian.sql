CREATE TYPE "public"."contact_import_status" AS ENUM('running', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "contact_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"list_id" uuid NOT NULL,
	"blob_url" text NOT NULL,
	"original_filename" text NOT NULL,
	"content_type" text NOT NULL,
	"column_map" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ingestion_status" "contact_import_status" DEFAULT 'running' NOT NULL,
	"number_of_inspected_rows" integer DEFAULT 0 NOT NULL,
	"number_of_ingested_rows" integer DEFAULT 0 NOT NULL,
	"number_of_skipped_rows" integer DEFAULT 0 NOT NULL,
	"errors" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "contact_imports" ADD CONSTRAINT "contact_imports_list_id_contacts_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."contacts_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_imports_tenant_list_created_idx" ON "contact_imports" USING btree ("tenant_id","list_id","created_at" DESC NULLS LAST);