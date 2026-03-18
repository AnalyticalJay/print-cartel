CREATE TABLE `paymentRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentMethod` varchar(50) NOT NULL,
	`paymentStatus` enum('pending','completed','failed','refunded') DEFAULT 'pending',
	`transactionId` varchar(255),
	`paymentType` enum('deposit','final_payment') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentStatus` enum('unpaid','deposit_paid','paid','cancelled') DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentMethod` enum('deposit','full_payment') DEFAULT 'full_payment';--> statement-breakpoint
ALTER TABLE `orders` ADD `depositAmount` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `orders` ADD `amountPaid` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `orders` ADD `invoiceNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `orders` ADD `invoiceDate` timestamp;