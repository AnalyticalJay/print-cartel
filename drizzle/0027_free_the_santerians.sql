DROP TABLE `quoteReminders`;--> statement-breakpoint
DROP TABLE `quoteTemplates`;--> statement-breakpoint
DROP TABLE `quotes`;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` enum('pending','approved','in-production','completed','shipped','cancelled') NOT NULL DEFAULT 'pending';