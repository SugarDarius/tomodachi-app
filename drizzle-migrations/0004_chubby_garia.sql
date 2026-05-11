DROP INDEX "contacts_tenant_email_normalized_uidx";--> statement-breakpoint
CREATE INDEX "contacts_tenant_email_idx" ON "contacts" USING btree ("tenant_id","email");--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN "email_normalized";