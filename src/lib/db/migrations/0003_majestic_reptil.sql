CREATE TABLE "wallet_bindings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"provider" text NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "wallet_bindings_address_idx" ON "wallet_bindings" USING btree ("address");