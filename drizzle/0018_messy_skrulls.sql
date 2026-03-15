CREATE TABLE `orderLineItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`colorId` int NOT NULL,
	`sizeId` int NOT NULL,
	`quantity` int NOT NULL,
	`placementId` int NOT NULL,
	`printSizeId` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orderLineItems_id` PRIMARY KEY(`id`)
);
