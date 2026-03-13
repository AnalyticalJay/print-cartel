CREATE TABLE `designTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`templateImageUrl` varchar(500) NOT NULL,
	`templateDesignUrl` varchar(500) NOT NULL,
	`defaultProductId` int,
	`defaultColorId` int,
	`defaultPlacements` json,
	`defaultPrintSizes` json,
	`isPopular` boolean DEFAULT false,
	`usageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `designTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templateCustomizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`customizationType` enum('color','text','size','placement') NOT NULL,
	`label` varchar(255) NOT NULL,
	`defaultValue` varchar(255),
	`allowedValues` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `templateCustomizations_id` PRIMARY KEY(`id`)
);
