import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createResellerInquiry,
  getAllResellerInquiries,
  getResellerInquiry,
  updateResellerInquiryStatus,
  getBulkPricingTiers,
  getAllBulkPricingTiers,
} from "../db";
import { notifyOwner } from "../_core/notification";

export const resellerRouter = router({
  // Submit a reseller inquiry
  submitInquiry: publicProcedure
    .input(
      z.object({
        companyName: z.string().min(1, "Company name is required"),
        contactName: z.string().min(1, "Contact name is required"),
        email: z.string().email("Invalid email address"),
        phone: z.string().min(10, "Phone number must be at least 10 digits"),
        businessType: z.string().min(1, "Business type is required"),
        estimatedMonthlyVolume: z.string().min(1, "Estimated monthly volume is required"),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const inquiryId = await createResellerInquiry({
          companyName: input.companyName,
          contactName: input.contactName,
          email: input.email,
          phone: input.phone,
          businessType: input.businessType,
          estimatedMonthlyVolume: input.estimatedMonthlyVolume,
          message: input.message || null,
          status: "new",
        });

        // Notify owner of new reseller inquiry
        await notifyOwner({
          title: "New Reseller Inquiry",
          content: `${input.contactName} from ${input.companyName} has submitted a reseller inquiry.\n\nBusiness Type: ${input.businessType}\nEstimated Monthly Volume: ${input.estimatedMonthlyVolume}\nEmail: ${input.email}\nPhone: ${input.phone}`,
        });

        return { success: true, inquiryId };
      } catch (error) {
        console.error("Failed to create reseller inquiry:", error);
        throw new Error("Failed to submit reseller inquiry");
      }
    }),

  // Get all reseller inquiries (admin only)
  getAllInquiries: publicProcedure.query(async () => {
    try {
      return await getAllResellerInquiries();
    } catch (error) {
      console.error("Failed to get reseller inquiries:", error);
      return [];
    }
  }),

  // Get a specific reseller inquiry
  getInquiry: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getResellerInquiry(input.id);
      } catch (error) {
        console.error("Failed to get reseller inquiry:", error);
        return null;
      }
    }),

  // Update reseller inquiry status (admin only)
  updateInquiryStatus: publicProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "qualified", "rejected"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await updateResellerInquiryStatus(input.id, input.status);
        return { success: true };
      } catch (error) {
        console.error("Failed to update reseller inquiry status:", error);
        throw new Error("Failed to update inquiry status");
      }
    }),

  // Get bulk pricing tiers for a product
  getBulkPricing: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getBulkPricingTiers(input.productId);
      } catch (error) {
        console.error("Failed to get bulk pricing tiers:", error);
        return [];
      }
    }),

  // Get all bulk pricing tiers
  getAllBulkPricing: publicProcedure.query(async () => {
    try {
      return await getAllBulkPricingTiers();
    } catch (error) {
      console.error("Failed to get bulk pricing tiers:", error);
      return [];
    }
  }),
});
