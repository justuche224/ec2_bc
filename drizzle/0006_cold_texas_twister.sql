CREATE TABLE `balance` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`currency` enum('BTC','ETH','USDT','SOL','BNB','LTC') NOT NULL,
	`amount` varchar(255) NOT NULL DEFAULT '0',
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `balance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deposit` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`system_wallet_id` varchar(36) NOT NULL,
	`currency` enum('BTC','ETH','USDT','SOL','BNB','LTC') NOT NULL,
	`amount` varchar(255) NOT NULL,
	`status` enum('PENDING','APPROVED','REJECTED','FAILED') NOT NULL DEFAULT 'PENDING',
	`rejection_reason` text,
	`approved_at` timestamp,
	`rejected_at` timestamp,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `deposit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `balance` ADD CONSTRAINT `balance_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deposit` ADD CONSTRAINT `deposit_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deposit` ADD CONSTRAINT `deposit_system_wallet_id_system_wallet_id_fk` FOREIGN KEY (`system_wallet_id`) REFERENCES `system_wallet`(`id`) ON DELETE cascade ON UPDATE no action;