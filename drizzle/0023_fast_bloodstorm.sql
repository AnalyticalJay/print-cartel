ALTER TABLE `orders` ADD `paymentProofUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentProofUploadedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentVerificationStatus` enum('pending','verified','rejected') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentVerificationNotes` text;