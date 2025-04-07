CREATE TABLE `investments` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`plan_id` varchar(36) NOT NULL,
	`currency` enum('BTC','ETH','USDT','SOL','BNB','LTC') NOT NULL,
	`txn` varchar(255) NOT NULL,
	`amount` double NOT NULL,
	`target_profit` double NOT NULL,
	`current_profit` double NOT NULL,
	`status` enum('PENDING','ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`no_of_roi` int NOT NULL,
	`profit_percent` double NOT NULL,
	`next_profit` double NOT NULL,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `investments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `investments` ADD CONSTRAINT `investments_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `investments` ADD CONSTRAINT `investments_plan_id_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE cascade ON UPDATE no action;