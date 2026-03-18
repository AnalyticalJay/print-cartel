CREATE TABLE `orderStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`previousStatus` enum('pending','quoted','approved','in-production','completed','shipped','cancelled'),
	`newStatus` enum('pending','quoted','approved','in-production','completed','shipped','cancelled') NOT NULL,
	`changedBy` int,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderStatusHistory_id` PRIMARY KEY(`id`)
);
