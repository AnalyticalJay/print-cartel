CREATE TABLE `designQuantityTracker` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lineItemId` int NOT NULL,
	`quantityNumber` int NOT NULL,
	`hasCustomDesign` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `designQuantityTracker_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `designSummaryCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`totalDesignCount` int NOT NULL,
	`placementBreakdown` json,
	`hasMultipleDesignVariations` boolean NOT NULL DEFAULT false,
	`lastUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `designSummaryCache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `designUploadsByQuantity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`designQuantityId` int NOT NULL,
	`placementId` int NOT NULL,
	`printSizeId` int NOT NULL,
	`uploadedFilePath` varchar(500) NOT NULL,
	`uploadedFileName` varchar(255) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`thumbnailUrl` varchar(500),
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `designUploadsByQuantity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lineItemDesignVariations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lineItemId` int NOT NULL,
	`designVariationType` enum('same_across_all','different_per_quantity') NOT NULL DEFAULT 'same_across_all',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lineItemDesignVariations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `designQuantityTracker` ADD CONSTRAINT `designQuantityTracker_lineItemId_orderLineItems_id_fk` FOREIGN KEY (`lineItemId`) REFERENCES `orderLineItems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `designSummaryCache` ADD CONSTRAINT `designSummaryCache_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `designUploadsByQuantity` ADD CONSTRAINT `designUploadsByQuantity_designQuantityId_designQuantityTracker_id_fk` FOREIGN KEY (`designQuantityId`) REFERENCES `designQuantityTracker`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `designUploadsByQuantity` ADD CONSTRAINT `designUploadsByQuantity_placementId_printPlacements_id_fk` FOREIGN KEY (`placementId`) REFERENCES `printPlacements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `designUploadsByQuantity` ADD CONSTRAINT `designUploadsByQuantity_printSizeId_printOptions_id_fk` FOREIGN KEY (`printSizeId`) REFERENCES `printOptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lineItemDesignVariations` ADD CONSTRAINT `lineItemDesignVariations_lineItemId_orderLineItems_id_fk` FOREIGN KEY (`lineItemId`) REFERENCES `orderLineItems`(`id`) ON DELETE cascade ON UPDATE no action;