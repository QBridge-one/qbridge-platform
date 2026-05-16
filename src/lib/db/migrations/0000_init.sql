CREATE TABLE "access_managers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" integer NOT NULL,
	"am_address" text NOT NULL,
	"kind" text NOT NULL,
	"org_id" text NOT NULL,
	"asset_id" text,
	"deployed_block" bigint NOT NULL,
	"deployed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indexer_cursors" (
	"chain_id" integer PRIMARY KEY NOT NULL,
	"last_indexed_block" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_assignment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_manager_id" uuid NOT NULL,
	"role_id" bigint NOT NULL,
	"account" text NOT NULL,
	"kind" text NOT NULL,
	"block_number" bigint NOT NULL,
	"block_timestamp" timestamp with time zone NOT NULL,
	"tx_hash" text NOT NULL,
	"log_index" integer NOT NULL,
	"by_account" text,
	"extra" jsonb
);
--> statement-breakpoint
CREATE TABLE "role_assignments" (
	"access_manager_id" uuid NOT NULL,
	"role_id" bigint NOT NULL,
	"account" text NOT NULL,
	"execution_delay" integer DEFAULT 0 NOT NULL,
	"granted_at" timestamp with time zone NOT NULL,
	"granted_block" bigint NOT NULL,
	"granted_tx_hash" text NOT NULL,
	"granted_by" text NOT NULL,
	CONSTRAINT "role_assignments_access_manager_id_role_id_account_pk" PRIMARY KEY("access_manager_id","role_id","account")
);
--> statement-breakpoint
ALTER TABLE "role_assignment_events" ADD CONSTRAINT "role_assignment_events_access_manager_id_access_managers_id_fk" FOREIGN KEY ("access_manager_id") REFERENCES "public"."access_managers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_access_manager_id_access_managers_id_fk" FOREIGN KEY ("access_manager_id") REFERENCES "public"."access_managers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "am_chain_addr_uq" ON "access_managers" USING btree ("chain_id","am_address");--> statement-breakpoint
CREATE INDEX "am_org_kind_idx" ON "access_managers" USING btree ("org_id","kind");--> statement-breakpoint
CREATE INDEX "am_asset_idx" ON "access_managers" USING btree ("asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rae_idem_uq" ON "role_assignment_events" USING btree ("access_manager_id","tx_hash","log_index");--> statement-breakpoint
CREATE INDEX "rae_account_block_idx" ON "role_assignment_events" USING btree ("account","block_number");--> statement-breakpoint
CREATE INDEX "rae_am_block_idx" ON "role_assignment_events" USING btree ("access_manager_id","block_number");--> statement-breakpoint
CREATE INDEX "ra_account_idx" ON "role_assignments" USING btree ("account");--> statement-breakpoint
CREATE INDEX "ra_am_role_idx" ON "role_assignments" USING btree ("access_manager_id","role_id");