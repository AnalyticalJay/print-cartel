CREATE TABLE `chatFileAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`conversationId` int NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileType` enum('image','document','video','audio','other') NOT NULL,
	`uploadedBy` int,
	`uploadedByType` enum('user','admin') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatFileAttachments_id` PRIMARY KEY(`id`)
);
