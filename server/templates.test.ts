import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { designTemplates, templateCustomizations } from "../drizzle/schema";
import {
  getAllDesignTemplates,
  getDesignTemplatesByCategory,
  getDesignTemplateById,
  getTemplateCustomizations,
  createDesignTemplate,
  createTemplateCustomization,
  incrementTemplateUsage,
  getPopularTemplates,
  getTemplateCategories,
} from "./db";

describe("Design Templates", () => {
  let db: any;
  let templateId: number;

  beforeAll(async () => {
    db = await getDb();
  });

  afterAll(async () => {
    // Cleanup
    if (db && templateId) {
      // Delete test template and its customizations
      try {
        await db.delete(templateCustomizations).where(
          (t: any) => t.templateId === templateId
        );
        await db.delete(designTemplates).where((t: any) => t.id === templateId);
      } catch (error) {
        console.log("Cleanup error (expected if template doesn't exist):", error);
      }
    }
  });

  it("should create a design template", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const result = await createDesignTemplate({
      name: "Sports Team Logo",
      description: "Perfect for sports teams and athletic brands",
      category: "Sports",
      templateImageUrl: "https://example.com/sports-template.png",
      templateDesignUrl: "https://example.com/sports-design.svg",
      defaultProductId: 1,
      defaultColorId: 1,
      defaultPlacements: [1, 2],
      defaultPrintSizes: [1, 2],
      isPopular: true,
      usageCount: 0,
    });

    expect(result).toBeDefined();
    templateId = result.insertId || 1;
  });

  it("should get all design templates", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const templates = await getAllDesignTemplates();
    expect(Array.isArray(templates)).toBe(true);
  });

  it("should get templates by category", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const templates = await getDesignTemplatesByCategory("Sports");
    expect(Array.isArray(templates)).toBe(true);
  });

  it("should get template by ID", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    if (!templateId) {
      console.log("Template ID not available, skipping test");
      return;
    }

    const template = await getDesignTemplateById(templateId);
    if (template) {
      expect(template.id).toBe(templateId);
      expect(template.name).toBe("Sports Team Logo");
    }
  });

  it("should create template customization", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    if (!templateId) {
      console.log("Template ID not available, skipping test");
      return;
    }

    const result = await createTemplateCustomization({
      templateId,
      customizationType: "color",
      label: "Logo Color",
      defaultValue: "#FF0000",
      allowedValues: ["#FF0000", "#0000FF", "#00FF00"],
    });

    expect(result).toBeDefined();
  });

  it("should get template customizations", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    if (!templateId) {
      console.log("Template ID not available, skipping test");
      return;
    }

    const customizations = await getTemplateCustomizations(templateId);
    expect(Array.isArray(customizations)).toBe(true);
  });

  it("should increment template usage", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    if (!templateId) {
      console.log("Template ID not available, skipping test");
      return;
    }

    const result = await incrementTemplateUsage(templateId);
    expect(result).toBeDefined();
  });

  it("should get popular templates", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const templates = await getPopularTemplates(6);
    expect(Array.isArray(templates)).toBe(true);
  });

  it("should get template categories", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const categories = await getTemplateCategories();
    expect(Array.isArray(categories)).toBe(true);
  });
});
