CREATE TYPE "public"."contact_import_chunk_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "contact_import_chunks" (
	"import_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"byte_start" bigint NOT NULL,
	"byte_end_exclusive" bigint NOT NULL,
	"first_row_number" integer NOT NULL,
	"status" "contact_import_chunk_status" DEFAULT 'pending' NOT NULL,
	"number_of_inspected_rows" integer DEFAULT 0 NOT NULL,
	"number_of_ingested_rows" integer DEFAULT 0 NOT NULL,
	"number_of_skipped_rows" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contact_import_chunks_import_id_chunk_index_pk" PRIMARY KEY("import_id","chunk_index")
);
--> statement-breakpoint
ALTER TABLE "contact_import_chunks" ADD CONSTRAINT "contact_import_chunks_import_id_contact_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."contact_imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_import_chunks_import_id_status_idx" ON "contact_import_chunks" USING btree ("import_id","status");