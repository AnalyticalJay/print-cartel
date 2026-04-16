CREATE TABLE `quoteReminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`reminderType` enum('expiring_soon','expired','follow_up') NOT NULL,
	`sentAt` timestamp,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`attemptCount` int DEFAULT 0,
	`lastAttemptAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quoteReminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quoteTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`templateType` enum('standard','bulk','reseller','custom') NOT NULL DEFAULT 'standard',
	`headerText` text,
	`footerText` text,
	`includeTermsAndConditions` boolean DEFAULT true,
	`termsAndConditions` text,
	`paymentTerms` varchar(255),
	`deliveryTerms` varchar(255),
	`validityDays` int DEFAULT 7,
	`discountPercentage` decimal(5,2),
	`discountReason` varchar(255),
	`notes` text,
	`isActive` boolean DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quoteTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`adminId` int NOT NULL,
	`templateId` int,
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
--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` enum('pending','quoted','approved','in-production','completed','shipped','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `quoteReminders` ADD CONSTRAINT `quoteReminders_quoteId_quotes_id_fk` FOREIGN KEY (`quoteId`) REFERENCES `quotes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quoteTemplates` ADD CONSTRAINT `quoteTemplates_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_quote_reminders_status` ON `quoteReminders` (`status`,`reminderType`);--> statement-breakpoint
CREATE INDEX `idx_quote_reminders_createdAt` ON `quoteReminders` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_quote_templates_createdBy` ON `quoteTemplates` (`createdBy`);--> statement-breakpoint
CREATE INDEX `idx_quote_templates_type` ON `quoteTemplates` (`templateType`);--> statement-breakpoint
CREATE INDEX `idx_quote_templates_active` ON `quoteTemplates` (`isActive`);