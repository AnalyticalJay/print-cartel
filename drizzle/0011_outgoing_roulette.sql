ALTER TABLE `chatMessages` ADD `messageType` enum('text','system','status_update') DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE `chatMessages` ADD `metadata` text;