ALTER TABLE `orders` ADD `quoteApprovedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `quoteRejectedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `quoteRejectionReason` text;