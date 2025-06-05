ALTER TABLE "bank" ADD COLUMN "admin_bank_name" text;--> statement-breakpoint
ALTER TABLE "bank" ADD COLUMN "admin_bank_account_number" text;--> statement-breakpoint
ALTER TABLE "bank" ADD COLUMN "admin_bank_account_name" text;--> statement-breakpoint
ALTER TABLE "bank" ADD COLUMN "instructions_sent" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "cashapp" ADD COLUMN "admin_cashtag" text;--> statement-breakpoint
ALTER TABLE "cashapp" ADD COLUMN "admin_cashapp_name" text;--> statement-breakpoint
ALTER TABLE "cashapp" ADD COLUMN "instructions_sent" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "paypal" ADD COLUMN "admin_paypal_email" text;--> statement-breakpoint
ALTER TABLE "paypal" ADD COLUMN "admin_paypal_name" text;--> statement-breakpoint
ALTER TABLE "paypal" ADD COLUMN "instructions_sent" boolean DEFAULT true NOT NULL;