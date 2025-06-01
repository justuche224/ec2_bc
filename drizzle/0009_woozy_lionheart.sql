CREATE TABLE "bank_withdrawal" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"currency" "currency" NOT NULL,
	"amount" varchar(255) NOT NULL,
	"status" "status" DEFAULT 'PENDING' NOT NULL,
	"bank_name" text NOT NULL,
	"bank_account_number" text NOT NULL,
	"bank_account_name" text NOT NULL,
	"rejection_reason" text,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cashapp_withdrawal" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"currency" "currency" NOT NULL,
	"amount" varchar(255) NOT NULL,
	"status" "status" DEFAULT 'PENDING' NOT NULL,
	"cashtag" text NOT NULL,
	"cashapp_name" text NOT NULL,
	"rejection_reason" text,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paypal_withdrawal" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"currency" "currency" NOT NULL,
	"amount" varchar(255) NOT NULL,
	"status" "status" DEFAULT 'PENDING' NOT NULL,
	"paypal_email" text NOT NULL,
	"paypal_name" text NOT NULL,
	"rejection_reason" text,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_withdrawal" ADD CONSTRAINT "bank_withdrawal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashapp_withdrawal" ADD CONSTRAINT "cashapp_withdrawal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paypal_withdrawal" ADD CONSTRAINT "paypal_withdrawal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;