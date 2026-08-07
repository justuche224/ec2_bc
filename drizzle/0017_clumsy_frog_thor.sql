CREATE TYPE "public"."academy_item_type" AS ENUM('BOOK', 'COURSE');--> statement-breakpoint
CREATE TABLE "academy_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"type" "academy_item_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"price" double precision NOT NULL,
	"cover_image" text NOT NULL,
	"delivery_link" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy_purchases" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"item_id" varchar(36) NOT NULL,
	"amount" double precision NOT NULL,
	"payment_proof" text NOT NULL,
	"status" "status" DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy_settings" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"book_wallet_address" text,
	"book_wallet_network" text,
	"course_wallet_address" text,
	"course_wallet_network" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "academy_purchases" ADD CONSTRAINT "academy_purchases_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_purchases" ADD CONSTRAINT "academy_purchases_item_id_academy_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."academy_items"("id") ON DELETE cascade ON UPDATE no action;