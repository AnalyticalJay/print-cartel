ALTER TABLE `orders` ADD `deliveryMethod` enum('collection','delivery') NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryAddress` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryCharge` decimal(10,2) DEFAULT '0';