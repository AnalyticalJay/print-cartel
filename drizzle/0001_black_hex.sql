CREATE TABLE `orderPrints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`printSizeId` int NOT NULL,
	`placementId` int NOT NULL,
	`uploadedFilePath` varchar(500) NOT NULL,
	`uploadedFileName` varchar(255) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	CONSTRAINT `orderPrints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`productId` int NOT NULL,
	`colorId` int NOT NULL,
	`sizeId` int NOT NULL,
	`quantity` int NOT NULL,
	`totalPriceEstimate` decimal(10,2) NOT NULL,
	`status` enum('pending','quoted','approved') NOT NULL DEFAULT 'pending',
	`customerFirstName` varchar(255) NOT NULL,
	`customerLastName` varchar(255) NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerPhone` varchar(20) NOT NULL,
	`customerCompany` varchar(255),
	`additionalNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `printOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`printSize` varchar(10) NOT NULL,
	`additionalPrice` decimal(10,2) NOT NULL,
	CONSTRAINT `printOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `printPlacements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`placementName` varchar(100) NOT NULL,
	`positionCoordinates` json,
	CONSTRAINT `printPlacements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productColors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`colorName` varchar(100) NOT NULL,
	`colorHex` varchar(7) NOT NULL,
	CONSTRAINT `productColors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productSizes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`sizeName` varchar(10) NOT NULL,
	CONSTRAINT `productSizes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`basePrice` decimal(10,2) NOT NULL,
	`description` text,
	`fabricType` varchar(255),
	`productType` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `firstName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `lastName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `companyName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `name`;