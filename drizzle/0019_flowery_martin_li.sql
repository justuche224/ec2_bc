CREATE TABLE "airdrop_tasks" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50) DEFAULT 'SOCIAL' NOT NULL,
	"reward" integer DEFAULT 100 NOT NULL,
	"action_url" text,
	"action_label" text DEFAULT 'Start Task',
	"task_type" varchar(50) DEFAULT 'ONCE' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "airdrop_user_profile" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"test_token_balance" integer DEFAULT 0 NOT NULL,
	"xrpl_wallet_address" text,
	"xrpl_destination_tag" text,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"last_checkin_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "airdrop_user_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "crowdfunding_certificates" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"certificate_code" varchar(64) NOT NULL,
	"level" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"points_threshold" integer NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crowdfunding_certificates_certificate_code_unique" UNIQUE("certificate_code")
);
--> statement-breakpoint
CREATE TABLE "crowdfunding_cycle_history" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"cycle_number" integer NOT NULL,
	"stars_awarded" integer DEFAULT 1 NOT NULL,
	"participants_count" integer DEFAULT 12 NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crowdfunding_ledger" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"source_user_id" varchar(36) NOT NULL,
	"tier" integer NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"points_delta" integer DEFAULT 1 NOT NULL,
	"deposit_id" varchar(36),
	"deposit_amount" double precision,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crowdfunding_user_achievements" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"direct_participants" integer DEFAULT 0 NOT NULL,
	"indirect_participants" integer DEFAULT 0 NOT NULL,
	"completed_cycles" integer DEFAULT 0 NOT NULL,
	"cycle_remainder" integer DEFAULT 0 NOT NULL,
	"stars_earned" integer DEFAULT 0 NOT NULL,
	"level1_achieved_at" timestamp,
	"level2_achieved_at" timestamp,
	"level3_achieved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crowdfunding_user_achievements_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "ico_purchases" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"round_id" varchar(36) NOT NULL,
	"tokens_allocated" double precision NOT NULL,
	"currency_paid" varchar(20) NOT NULL,
	"amount_paid" double precision NOT NULL,
	"usd_value" double precision NOT NULL,
	"xrpl_wallet_address" text,
	"status" varchar(50) DEFAULT 'CONFIRMED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ico_rounds" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"stage_number" integer DEFAULT 1 NOT NULL,
	"price_usd" double precision DEFAULT 0.05 NOT NULL,
	"total_tokens" double precision DEFAULT 15000000 NOT NULL,
	"sold_tokens" double precision DEFAULT 0 NOT NULL,
	"min_purchase_usd" double precision DEFAULT 20 NOT NULL,
	"max_purchase_usd" double precision DEFAULT 50000 NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nowpayments_transaction" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"payment_id" varchar(100) NOT NULL,
	"payment_status" varchar(50) DEFAULT 'waiting' NOT NULL,
	"pay_address" text NOT NULL,
	"price_amount" double precision NOT NULL,
	"price_currency" varchar(10) DEFAULT 'usd' NOT NULL,
	"pay_amount" double precision NOT NULL,
	"actually_paid" double precision DEFAULT 0,
	"pay_currency" varchar(20) NOT NULL,
	"order_id" varchar(100),
	"order_description" text,
	"ipn_callback_url" text,
	"credited" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "nowpayments_transaction_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "user_airdrop_completions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"task_id" varchar(36) NOT NULL,
	"status" varchar(50) DEFAULT 'COMPLETED' NOT NULL,
	"reward_paid" integer NOT NULL,
	"metadata" text,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crowdfunding_settings" ADD COLUMN "qualifying_deposit_amount" double precision DEFAULT 99 NOT NULL;--> statement-breakpoint
ALTER TABLE "crowdfunding_settings" ADD COLUMN "max_team_depth" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "crowdfunding_settings" ADD COLUMN "cycle_requirement" integer DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE "crowdfunding_settings" ADD COLUMN "level1_points" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "crowdfunding_settings" ADD COLUMN "level2_points" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "crowdfunding_settings" ADD COLUMN "level3_points" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "make" varchar(100);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "model" varchar(100);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "condition" varchar(50) DEFAULT 'BRAND_NEW' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "transaction_type" varchar(50) DEFAULT 'BUY' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "availability" varchar(50) DEFAULT 'IN_STOCK' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "operating_hours" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "engine_hp" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "location_country" varchar(100);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "location_city" varchar(100);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "seller_verification" varchar(50) DEFAULT 'VERIFIED_DEALER' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "inspection" varchar(50) DEFAULT 'NOT_INSPECTED' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "warranty" varchar(100) DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "delivery" varchar(100) DEFAULT 'BUYER_PICKUP' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "inspection_report_url" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "specifications" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "status" varchar(50) DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product_category" ADD COLUMN "code" varchar(50);--> statement-breakpoint
ALTER TABLE "product_category" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "airdrop_user_profile" ADD CONSTRAINT "airdrop_user_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crowdfunding_certificates" ADD CONSTRAINT "crowdfunding_certificates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crowdfunding_cycle_history" ADD CONSTRAINT "crowdfunding_cycle_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crowdfunding_ledger" ADD CONSTRAINT "crowdfunding_ledger_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crowdfunding_ledger" ADD CONSTRAINT "crowdfunding_ledger_source_user_id_user_id_fk" FOREIGN KEY ("source_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crowdfunding_user_achievements" ADD CONSTRAINT "crowdfunding_user_achievements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ico_purchases" ADD CONSTRAINT "ico_purchases_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ico_purchases" ADD CONSTRAINT "ico_purchases_round_id_ico_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."ico_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nowpayments_transaction" ADD CONSTRAINT "nowpayments_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_airdrop_completions" ADD CONSTRAINT "user_airdrop_completions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_airdrop_completions" ADD CONSTRAINT "user_airdrop_completions_task_id_airdrop_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."airdrop_tasks"("id") ON DELETE cascade ON UPDATE no action;