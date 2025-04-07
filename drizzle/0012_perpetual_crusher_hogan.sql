CREATE TABLE `plans` (
	`id` varchar(36) NOT NULL,
	`type` varchar(255) NOT NULL,
	`price` int NOT NULL,
	`min_roi_amount` double NOT NULL,
	`max_roi_amount` double NOT NULL,
	`commission` double NOT NULL,
	`percentage` double NOT NULL,
	`duration` int NOT NULL,
	`description` text NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`)
);
