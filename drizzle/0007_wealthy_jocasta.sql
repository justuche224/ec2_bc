CREATE TABLE "paypal" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"amount" varchar(255) NOT NULL,
	"paypal_email" text NOT NULL,
	"paypal_name" text NOT NULL,
	"payment_proof" text,
	"status" "status" DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "paypal" ADD CONSTRAINT "paypal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;