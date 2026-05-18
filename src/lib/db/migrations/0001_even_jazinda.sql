CREATE TABLE "audit_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text,
	"actor_user_id" text NOT NULL,
	"action" text NOT NULL,
	"target" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" text DEFAULT 'email' NOT NULL,
	"kind" text NOT NULL,
	"to_address" text NOT NULL,
	"to_user_id" text,
	"org_id" text,
	"subject" text NOT NULL,
	"html" text NOT NULL,
	"text_body" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dedupe_key" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"action_url" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dedupe_key" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_org_ts_idx" ON "audit_entries" USING btree ("org_id","ts" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_actor_ts_idx" ON "audit_entries" USING btree ("actor_user_id","ts" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_action_ts_idx" ON "audit_entries" USING btree ("action","ts" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "outbox_pending_idx" ON "notification_outbox" USING btree ("locked_until","created_at") WHERE sent_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_dedupe_uq" ON "notification_outbox" USING btree ("channel","kind","to_address","dedupe_key") WHERE dedupe_key IS NOT NULL;--> statement-breakpoint
CREATE INDEX "notif_user_read_created_idx" ON "notifications" USING btree ("user_id","read_at","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notif_org_kind_created_idx" ON "notifications" USING btree ("org_id","kind","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "notif_dedupe_uq" ON "notifications" USING btree ("kind","org_id","user_id","dedupe_key") WHERE dedupe_key IS NOT NULL;