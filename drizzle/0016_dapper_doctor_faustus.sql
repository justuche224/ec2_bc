CREATE TABLE "beneficiaries" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"full_name" text NOT NULL,
	"relationship" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"city" text,
	"country" text,
	"postal_code" text,
	"date_of_birth" timestamp,
	"bank_name" text,
	"bank_account_number" text,
	"bank_account_name" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;