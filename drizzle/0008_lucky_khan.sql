CREATE TABLE `product` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`img` text NOT NULL,
	`price` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `product_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_category` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `product_category_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `product` ADD CONSTRAINT `product_category_id_product_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `product_category`(`id`) ON DELETE cascade ON UPDATE no action;