CREATE TABLE `transfer` (
	`id` varchar(36) NOT NULL,
	`sender_id` varchar(36) NOT NULL,
	`recipient_id` varchar(36) NOT NULL,
	`from_currency` enum('BTC','ETH','USDT','SOL','BNB','LTC') NOT NULL,
	`to_currency` enum('BTC','ETH','USDT','SOL','BNB','LTC') NOT NULL,
	`amount` varchar(255) NOT NULL,
	`type` enum('INTERNAL','INTER_USER') NOT NULL,
	`status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`rejection_reason` text,
	`approved_at` timestamp,
	`rejected_at` timestamp,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `transfer_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `transfer` ADD CONSTRAINT `transfer_sender_id_user_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer` ADD CONSTRAINT `transfer_recipient_id_user_id_fk` FOREIGN KEY (`recipient_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;