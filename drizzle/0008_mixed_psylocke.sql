CREATE TABLE "bank" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"amount" varchar(255) NOT NULL,
	"bank_name" text NOT NULL,
	"bank_account_number" text NOT NULL,
	"bank_account_name" text NOT NULL,
	"payment_proof" text,
	"status" "status" DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank" ADD CONSTRAINT "bank_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;