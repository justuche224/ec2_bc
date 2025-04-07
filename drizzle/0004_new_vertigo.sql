CREATE TABLE `system_wallet` (
	`id` varchar(36) NOT NULL,
	`currency` enum('BTC','ETH','USDT','SOL','BNB','LTC') NOT NULL,
	`address` text NOT NULL,
	`qr_code` text NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `system_wallet_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_wallet` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`currency` enum('BTC','ETH','USDT','SOL','BNB','LTC') NOT NULL,
	`address` text NOT NULL,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `user_wallet_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallet` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`currency` enum('BTC','ETH','USDT','SOL','BNB','LTC') NOT NULL,
	`address` text NOT NULL,
	`qr_code` text NOT NULL,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `wallet_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_wallet` ADD CONSTRAINT `user_wallet_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet` ADD CONSTRAINT `wallet_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;