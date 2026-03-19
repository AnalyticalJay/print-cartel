ALTER TABLE `orders` ADD `invoiceUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `orders` ADD `invoiceAcceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `invoiceDeclinedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `invoiceDeclineReason` text;