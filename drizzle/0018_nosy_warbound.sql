CREATE TYPE "public"."marketer_commission_source" AS ENUM('DEPOSIT', 'BOOK', 'COURSE');--> statement-breakpoint
CREATE TYPE "public"."marketer_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "marketer_commissions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"marketer_id" varchar(36) NOT NULL,
	"source_type" "marketer_commission_source" NOT NULL,
	"source_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"amount" double precision NOT NULL,
	"percentage" double precision NOT NULL,
	"status" "status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketer_referrals" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"marketer_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketer_settings" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"deposit_commission_percent" double precision DEFAULT 5 NOT NULL,
	"book_commission_percent" double precision DEFAULT 10 NOT NULL,
	"course_commission_percent" double precision DEFAULT 10 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketers" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"password_hash" text NOT NULL,
	"bio" text,
	"social_links" text,
	"marketer_code" varchar(20) NOT NULL,
	"status" "marketer_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketers_email_unique" UNIQUE("email"),
	CONSTRAINT "marketers_marketer_code_unique" UNIQUE("marketer_code")
);
--> statement-breakpoint
ALTER TABLE "marketer_commissions" ADD CONSTRAINT "marketer_commissions_marketer_id_marketers_id_fk" FOREIGN KEY ("marketer_id") REFERENCES "public"."marketers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketer_commissions" ADD CONSTRAINT "marketer_commissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketer_referrals" ADD CONSTRAINT "marketer_referrals_marketer_id_marketers_id_fk" FOREIGN KEY ("marketer_id") REFERENCES "public"."marketers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketer_referrals" ADD CONSTRAINT "marketer_referrals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;