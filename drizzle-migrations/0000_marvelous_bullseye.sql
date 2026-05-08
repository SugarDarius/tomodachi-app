CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"email_normalized" text GENERATED ALWAYS AS (lower(trim(email))) STORED,
	"varying_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "email_present" CHECK (length(trim(email)) > 0)
);
--> statement-breakpoint
CREATE TABLE "contacts_list_members" (
	"list_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contacts_list_members_list_id_contact_id_pk" PRIMARY KEY("list_id","contact_id")
);
--> statement-breakpoint
CREATE TABLE "contacts_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "contacts_list_members" ADD CONSTRAINT "contacts_list_members_list_id_contacts_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."contacts_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts_list_members" ADD CONSTRAINT "contacts_list_members_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_tenant_email_normalized_uidx" ON "contacts" USING btree ("tenant_id","email_normalized");--> statement-breakpoint
CREATE INDEX "contacts_tenant_created_idx" ON "contacts" USING btree ("tenant_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "contacts_list_members_contact_idx" ON "contacts_list_members" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "contacts_lists_tenant_created_idx" ON "contacts_lists" USING btree ("tenant_id","created_at" DESC NULLS LAST);