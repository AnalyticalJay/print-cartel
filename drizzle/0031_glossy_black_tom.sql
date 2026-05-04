ALTER TABLE `orderPrints` ADD `designApprovalStatus` varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `orderPrints` ADD `designApprovalNotes` text;--> statement-breakpoint
ALTER TABLE `orderPrints` ADD `designApprovedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orderPrints` ADD `designReviewedBy` varchar(255);