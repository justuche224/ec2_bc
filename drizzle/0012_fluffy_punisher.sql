CREATE TYPE "public"."crowdfunding_pool_status" AS ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."crowdfunding_referral_status" AS ENUM('PENDING', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "crowdfunding_investments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"pool_id" varchar(36) NOT NULL,
	"currency" "currency" NOT NULL,
	"amount" double precision NOT NULL,
	"current_profit" double precision DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'ACTIVE' NOT NULL,
	"completed_referrals" integer DEFAULT 0 NOT NULL,
	"required_referrals" integer DEFAULT 10 NOT NULL,
	"is_eligible_for_airdrop" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crowdfunding_pools" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"target_participants" integer DEFAULT 100 NOT NULL,
	"current_participants" integer DEFAULT 0 NOT NULL,
	"total_invested" double precision DEFAULT 0 NOT NULL,
	"min_investment_amount" double precision NOT NULL,
	"status" "crowdfunding_pool_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crowdfunding_referrals" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"referrer_id" varchar(36) NOT NULL,
	"referree_id" varchar(36) NOT NULL,
	"investment_id" varchar(36),
	"status" "crowdfunding_referral_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "crowdfunding_settings" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"min_investment_amount" double precision DEFAULT 100 NOT NULL,
	"required_referrals" integer DEFAULT 10 NOT NULL,
	"system_target_participants" integer DEFAULT 1000 NOT NULL,
	"pool_target_participants" integer DEFAULT 100 NOT NULL,
	"referral_bonus_percent" double precision DEFAULT 5 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crowdfunding_investments" ADD CONSTRAINT "crowdfunding_investments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crowdfunding_investments" ADD CONSTRAINT "crowdfunding_investments_pool_id_crowdfunding_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."crowdfunding_pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crowdfunding_referrals" ADD CONSTRAINT "crowdfunding_referrals_referrer_id_user_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crowdfunding_referrals" ADD CONSTRAINT "crowdfunding_referrals_referree_id_user_id_fk" FOREIGN KEY ("referree_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crowdfunding_referrals" ADD CONSTRAINT "crowdfunding_referrals_investment_id_crowdfunding_investments_id_fk" FOREIGN KEY ("investment_id") REFERENCES "public"."crowdfunding_investments"("id") ON DELETE set null ON UPDATE no action;