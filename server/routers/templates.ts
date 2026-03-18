import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getAllDesignTemplates,
  getDesignTemplatesByCategory,
  getDesignTemplateById,
  getTemplateCustomizations,
  getPopularTemplates,
  getTemplateCategories,
  incrementTemplateUsage,
} from "../db";

export const templatesRouter = router({
  // Get all templates
  getAll: publicProcedure.query(async () => {
    return await getAllDesignTemplates();
  }),

  // Get templates by category
  getByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      return await getDesignTemplatesByCategory(input.category);
    }),

  // Get template by ID with customizations
  getById: publicProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => {
      const template = await getDesignTemplateById(input.templateId);
      if (!template) return null;

      const customizations = await getTemplateCustomizations(input.templateId);
      return {
        id: template.id,
        name: template.name,
        category: template.category,
        description: template.description,
        templateImageUrl: template.templateImageUrl,
        templateDesignUrl: template.templateDesignUrl,
        customizations,
      };
    }),

  // Get popular templates
  getPopular: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await getPopularTemplates(input.limit || 6);
    }),

  // Get all template categories
  getCategories: publicProcedure.query(async () => {
    return await getTemplateCategories();
  }),

  // Get template customization options
  getCustomizations: publicProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => {
      return await getTemplateCustomizations(input.templateId);
    }),

  // Track template usage when customer uses it
  trackUsage: publicProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ input }) => {
      await incrementTemplateUsage(input.templateId);
      return { success: true };
    }),
});
