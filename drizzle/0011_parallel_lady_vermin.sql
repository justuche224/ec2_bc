CREATE TABLE `referrals` (
	`id` varchar(36) NOT NULL,
	`referrer_id` varchar(36) NOT NULL,
	`referree_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referrer_id_user_id_fk` FOREIGN KEY (`referrer_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referree_id_user_id_fk` FOREIGN KEY (`referree_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;