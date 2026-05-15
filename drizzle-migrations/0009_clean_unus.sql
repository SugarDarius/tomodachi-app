CREATE TYPE "public"."contact_import_error_kind" AS ENUM('skip', 'fatal');--> statement-breakpoint
CREATE TABLE "contact_import_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_id" uuid NOT NULL,
	"kind" "contact_import_error_kind" NOT NULL,
	"row_number" integer,
	"reason" text,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_import_errors" ADD CONSTRAINT "contact_import_errors_import_id_contact_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."contact_imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_import_errors_import_created_idx" ON "contact_import_errors" USING btree ("import_id","created_at");--> statement-breakpoint
CREATE INDEX "contact_import_errors_import_skip_row_idx" ON "contact_import_errors" USING btree ("import_id","row_number");--> statement-breakpoint
ALTER TABLE "contact_imports" DROP COLUMN "errors";