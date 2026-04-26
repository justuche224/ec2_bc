ALTER TABLE "user" ADD COLUMN "failed_withdrawal_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "withdrawal_locked_until" timestamp;