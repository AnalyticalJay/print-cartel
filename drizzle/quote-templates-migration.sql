-- Create quote templates table
CREATE TABLE IF NOT EXISTS quoteTemplates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  templateType ENUM('standard', 'bulk', 'reseller', 'custom') NOT NULL DEFAULT 'standard',
  headerText TEXT,
  footerText TEXT,
  includeTermsAndConditions BOOLEAN DEFAULT TRUE,
  termsAndConditions TEXT,
  paymentTerms VARCHAR(255),
  deliveryTerms VARCHAR(255),
  validityDays INT DEFAULT 7,
  discountPercentage DECIMAL(5, 2),
  discountReason VARCHAR(255),
  notes TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- Add templateId to quotes table
ALTER TABLE quotes ADD COLUMN templateId INT AFTER adminId;
ALTER TABLE quotes ADD FOREIGN KEY (templateId) REFERENCES quoteTemplates(id);

-- Add reminder tracking table
CREATE TABLE IF NOT EXISTS quoteReminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quoteId INT NOT NULL,
  reminderType ENUM('expiring_soon', 'expired', 'follow_up') NOT NULL,
  sentAt TIMESTAMP,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  attemptCount INT DEFAULT 0,
  lastAttemptAt TIMESTAMP,
  errorMessage TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quoteId) REFERENCES quotes(id) ON DELETE CASCADE
);

-- Create index for quote reminders
CREATE INDEX idx_quote_reminders_status ON quoteReminders(status, reminderType);
CREATE INDEX idx_quote_reminders_createdAt ON quoteReminders(createdAt);
