CREATE TABLE `kyc` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`document_type` enum('ID_CARD','DRIVERS_LICENSE','PASSPORT','OTHER') NOT NULL,
	`front_image` text NOT NULL,
	`back_image` text NOT NULL,
	`selfie_image` text NOT NULL,
	`status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`rejection_reason` text,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `kyc_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user` ADD `kyc_verified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `kyc` ADD CONSTRAINT `kyc_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;