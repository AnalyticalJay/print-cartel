CREATE TABLE `bulkPricingTiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`minQuantity` int NOT NULL,
	`maxQuantity` int,
	`discountPercentage` decimal(5,2) NOT NULL,
	`pricePerUnit` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bulkPricingTiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resellerInquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`businessType` varchar(100) NOT NULL,
	`estimatedMonthlyVolume` varchar(50) NOT NULL,
	`message` text,
	`status` enum('new','contacted','qualified','rejected') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resellerInquiries_id` PRIMARY KEY(`id`)
);
