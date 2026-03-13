CREATE TABLE `productionQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`status` enum('pending','quoted','approved','in-production','ready','completed','shipped','cancelled') NOT NULL DEFAULT 'pending',
	`estimatedCompletionDate` timestamp,
	`actualCompletionDate` timestamp,
	`productionNotes` text,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`assignedToAdminId` int,
	`gangSheetId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productionQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referralProgram` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referralCode` varchar(50) NOT NULL,
	`discountPercentage` decimal(5,2) NOT NULL DEFAULT '10',
	`totalReferrals` int NOT NULL DEFAULT 0,
	`totalRewardValue` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referralProgram_id` PRIMARY KEY(`id`),
	CONSTRAINT `referralProgram_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `referralTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referralId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`referredEmail` varchar(320) NOT NULL,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`rewardAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`rewardType` enum('discount','credit','cash') NOT NULL DEFAULT 'discount',
	`firstOrderId` int,
	`firstOrderDate` timestamp,
	`rewardClaimedDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referralTracking_id` PRIMARY KEY(`id`)
);
