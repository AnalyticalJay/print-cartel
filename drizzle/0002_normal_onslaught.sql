CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`adminId` int NOT NULL,
	`basePrice` decimal(10,2) NOT NULL,
	`adjustedPrice` decimal(10,2) NOT NULL,
	`priceAdjustmentReason` text,
	`adminNotes` text,
	`status` enum('draft','sent','accepted','rejected','expired') NOT NULL DEFAULT 'draft',
	`expiresAt` timestamp,
	`sentAt` timestamp,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
