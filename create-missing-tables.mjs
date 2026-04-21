import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function createMissingTables() {
  const conn = await mysql.createConnection(connectionString);

  try {
    // Create quotes table first (dependency for quoteReminders)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orderId INT,
        customerId INT,
        quoteNumber VARCHAR(50) UNIQUE,
        description TEXT,
        totalAmount DECIMAL(10, 2),
        status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
        expiryDate DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created quotes table');

    // Create designQuantityTracker table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS designQuantityTracker (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lineItemId INT NOT NULL,
        quantityNumber INT NOT NULL,
        hasCustomDesign BOOLEAN DEFAULT false,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lineItemId) REFERENCES orderLineItems(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Created designQuantityTracker table');

    // Create designUploadsByQuantity table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS designUploadsByQuantity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        designQuantityId INT NOT NULL,
        placementId INT NOT NULL,
        printSizeId INT,
        uploadedFilePath VARCHAR(255),
        uploadedFileName VARCHAR(255),
        fileSize INT,
        mimeType VARCHAR(50),
        thumbnailUrl VARCHAR(255),
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (designQuantityId) REFERENCES designQuantityTracker(id) ON DELETE CASCADE,
        FOREIGN KEY (placementId) REFERENCES printPlacements(id),
        FOREIGN KEY (printSizeId) REFERENCES productSizes(id)
      )
    `);
    console.log('✓ Created designUploadsByQuantity table');

    // Create quoteReminders table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS quoteReminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quoteId INT NOT NULL,
        reminderType ENUM('first', 'second', 'final') DEFAULT 'first',
        sentAt DATETIME,
        nextReminderDate DATETIME,
        isActive BOOLEAN DEFAULT true,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (quoteId) REFERENCES quotes(id) ON DELETE CASCADE,
        INDEX idx_quoteId (quoteId),
        INDEX idx_nextReminderDate (nextReminderDate)
      )
    `);
    console.log('✓ Created quoteReminders table');

    // Create quoteTemplates table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS quoteTemplates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        templateType ENUM('standard', 'bulk', 'custom') DEFAULT 'standard',
        basePrice DECIMAL(10, 2),
        discountPercentage DECIMAL(5, 2),
        validFrom DATETIME,
        validUntil DATETIME,
        isActive BOOLEAN DEFAULT true,
        createdBy INT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        minQuantity INT,
        maxQuantity INT,
        INDEX idx_templateType (templateType),
        INDEX idx_isActive (isActive),
        INDEX idx_validUntil (validUntil)
      )
    `);
    console.log('✓ Created quoteTemplates table');

    // Create lineItemDesignVariations table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS lineItemDesignVariations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lineItemId INT NOT NULL,
        variationName VARCHAR(255),
        variationData JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lineItemId) REFERENCES orderLineItems(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Created lineItemDesignVariations table');

    console.log('\n✅ All missing tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

createMissingTables();
