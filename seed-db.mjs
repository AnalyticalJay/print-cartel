import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function seed() {
  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);

    // Clear existing data
    await connection.execute("DELETE FROM orderPrints");
    await connection.execute("DELETE FROM orders");
    await connection.execute("DELETE FROM productColors");
    await connection.execute("DELETE FROM productSizes");
    await connection.execute("DELETE FROM products");
    await connection.execute("DELETE FROM printPlacements");
    await connection.execute("DELETE FROM printOptions");

    console.log("✓ Cleared existing data");

    // Insert print options
    const printSizes = [
      { printSize: "A6", additionalPrice: 25.00 },
      { printSize: "A5", additionalPrice: 50.00 },
      { printSize: "A4", additionalPrice: 75.00 },
      { printSize: "A3", additionalPrice: 100.00 },
    ];

    for (const printSize of printSizes) {
      await connection.execute(
        "INSERT INTO printOptions (printSize, additionalPrice) VALUES (?, ?)",
        [printSize.printSize, printSize.additionalPrice]
      );
    }

    console.log("✓ Inserted print options");

    // Insert print placements
    const placements = [
      {
        placementName: "Front Chest",
        positionCoordinates: JSON.stringify({ x: 50, y: 100, width: 150, height: 150 }),
      },
      {
        placementName: "Full Front",
        positionCoordinates: JSON.stringify({ x: 20, y: 80, width: 260, height: 280 }),
      },
      {
        placementName: "Back",
        positionCoordinates: JSON.stringify({ x: 50, y: 100, width: 150, height: 150 }),
      },
      {
        placementName: "Sleeve Left",
        positionCoordinates: JSON.stringify({ x: 10, y: 50, width: 80, height: 100 }),
      },
      {
        placementName: "Sleeve Right",
        positionCoordinates: JSON.stringify({ x: 210, y: 50, width: 80, height: 100 }),
      },
      {
        placementName: "Neck Tag",
        positionCoordinates: JSON.stringify({ x: 100, y: 10, width: 100, height: 30 }),
      },
    ];

    for (const placement of placements) {
      await connection.execute(
        "INSERT INTO printPlacements (placementName, positionCoordinates) VALUES (?, ?)",
        [placement.placementName, placement.positionCoordinates]
      );
    }

    console.log("✓ Inserted print placements");

    // Insert products with colors and sizes
    const products = [
      {
        name: "Lightweight T-Shirt",
        basePrice: 70.00,
        description: "Crew neck, Neck ribbing, Tubular knit, Neck tape, double stitching on sleeves and hems. Unisex styles are based on men's sizes.",
        fabricType: "140gm / 100% Carded Cotton",
        productType: "T-Shirt",
        colors: [
          { colorName: "Black", colorHex: "#000000" },
          { colorName: "White", colorHex: "#FFFFFF" },
          { colorName: "Navy", colorHex: "#001F3F" },
          { colorName: "Royal Blue", colorHex: "#4169E1" },
          { colorName: "Sky Blue", colorHex: "#87CEEB" },
          { colorName: "Grey Melange", colorHex: "#A9A9A9" },
          { colorName: "Bottle Green", colorHex: "#006B3F" },
          { colorName: "Lime Green", colorHex: "#32CD32" },
          { colorName: "Red", colorHex: "#FF0000" },
          { colorName: "Orange", colorHex: "#FFA500" },
          { colorName: "Yellow", colorHex: "#FFFF00" },
        ],
        sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
      },
      {
        name: "Men's Polo",
        basePrice: 120.00,
        description: "Classic fit, Rib-knit collar, loose pocket provided 2 button placket, tonal buttons, Tubular knit, Double stitching on sleeves and hems. Unisex styles are based on men's sizes.",
        fabricType: "180gm 100% cotton pique",
        productType: "Polo",
        colors: [
          { colorName: "Black", colorHex: "#000000" },
          { colorName: "White", colorHex: "#FFFFFF" },
          { colorName: "Navy Blue", colorHex: "#001F3F" },
          { colorName: "Royal Blue", colorHex: "#4169E1" },
          { colorName: "Sky Blue", colorHex: "#87CEEB" },
          { colorName: "Khaki", colorHex: "#F0E68C" },
          { colorName: "Grey Melange", colorHex: "#A9A9A9" },
          { colorName: "Charcoal", colorHex: "#36454F" },
          { colorName: "Bottle Green", colorHex: "#006B3F" },
          { colorName: "Lime Green", colorHex: "#32CD32" },
          { colorName: "Yellow", colorHex: "#FFFF00" },
          { colorName: "Pink", colorHex: "#FFC0CB" },
          { colorName: "Red", colorHex: "#FF0000" },
          { colorName: "Orange", colorHex: "#FFA500" },
          { colorName: "Gold", colorHex: "#FFD700" },
        ],
        sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
      },
      {
        name: "Men's Dry Fit Polo",
        basePrice: 120.00,
        description: "Semi-fitted, Raglan sleeves, 2 button placket, tonal buttons, Side seamed, Double stitching on sleeves and hems. Unisex styles are based on men's sizes.",
        fabricType: "140gm 100% bird mesh polyester",
        productType: "Polo",
        colors: [
          { colorName: "Black", colorHex: "#000000" },
          { colorName: "White", colorHex: "#FFFFFF" },
          { colorName: "Navy", colorHex: "#001F3F" },
          { colorName: "Royal Blue", colorHex: "#4169E1" },
          { colorName: "Red", colorHex: "#FF0000" },
        ],
        sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
      },
      {
        name: "Hoodie",
        basePrice: 300.00,
        description: "Crew neck, Classic fit, Pullover hood, set-in sleeves, kangaroo pocket, Side seamed, Lined hood, tonal fabric drawcord, Ribbed waistband and sleeve cuffs. Unisex styles are based on men's sizes.",
        fabricType: "260gm 100% brushed cotton anti-pill fleece",
        productType: "Hoodie",
        colors: [
          { colorName: "Black", colorHex: "#000000" },
          { colorName: "White", colorHex: "#FFFFFF" },
          { colorName: "Navy", colorHex: "#001F3F" },
          { colorName: "Grey Melange", colorHex: "#A9A9A9" },
          { colorName: "Charcoal", colorHex: "#36454F" },
        ],
        sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      },
    ];

    for (const product of products) {
      const [result] = await connection.execute(
        "INSERT INTO products (name, basePrice, description, fabricType, productType) VALUES (?, ?, ?, ?, ?)",
        [product.name, product.basePrice, product.description, product.fabricType, product.productType]
      );

      const productId = result.insertId;

      // Insert colors
      for (const color of product.colors) {
        await connection.execute(
          "INSERT INTO productColors (productId, colorName, colorHex) VALUES (?, ?, ?)",
          [productId, color.colorName, color.colorHex]
        );
      }

      // Insert sizes
      for (const size of product.sizes) {
        await connection.execute(
          "INSERT INTO productSizes (productId, sizeName) VALUES (?, ?)",
          [productId, size]
        );
      }

      console.log(`✓ Inserted product: ${product.name}`);
    }

    console.log("\n✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seed();
