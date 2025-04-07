CREATE TABLE `withdrawal` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`currency` enum('BTC','ETH','USDT','SOL','BNB','LTC') NOT NULL,
	`amount` varchar(255) NOT NULL,
	`status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`destination_address` text NOT NULL,
	`rejection_reason` text,
	`approved_at` timestamp,
	`rejected_at` timestamp,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `withdrawal_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `withdrawal` ADD CONSTRAINT `withdrawal_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;