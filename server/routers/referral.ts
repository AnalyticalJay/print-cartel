import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createReferralProgram,
  getReferralProgramByUserId,
  getReferralProgramByCode,
  createReferralTracking,
  getReferralTrackingByReferralId,
  getReferralTrackingByReferredEmail,
  completeReferralTracking,
} from "../db";
import crypto from "crypto";

// Generate unique referral code
function generateReferralCode(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

export const referralRouter = router({
  // Get or create referral program for current user
  getOrCreateReferralProgram: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) throw new Error("User not authenticated");

    let referralProgram = await getReferralProgramByUserId(ctx.user.id);

    if (!referralProgram) {
      const referralCode = generateReferralCode();
      await createReferralProgram(ctx.user.id, referralCode, 10);
      referralProgram = await getReferralProgramByUserId(ctx.user.id);
    }

    return referralProgram;
  }),

  // Get referral program by code (for referred users)
  getReferralByCode: protectedProcedure
    .input(z.object({ referralCode: z.string() }))
    .query(async ({ input }) => {
      return await getReferralProgramByCode(input.referralCode);
    }),

  // Track a new referral
  trackReferral: protectedProcedure
    .input(
      z.object({
        referralCode: z.string(),
        referredEmail: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) throw new Error("User not authenticated");

      const referralProgram = await getReferralProgramByCode(input.referralCode);
      if (!referralProgram) {
        throw new Error("Invalid referral code");
      }

      // Check if already referred
      const existing = await getReferralTrackingByReferredEmail(input.referredEmail);
      if (existing) {
        throw new Error("This email has already been referred");
      }

      // Create referral tracking
      await createReferralTracking(referralProgram.id, input.referredEmail, ctx.user.id);

      return { success: true, message: "Referral tracked successfully" };
    }),

  // Get referrals for current user
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) throw new Error("User not authenticated");

    const referralProgram = await getReferralProgramByUserId(ctx.user.id);
    if (!referralProgram) {
      return [];
    }

    return await getReferralTrackingByReferralId(referralProgram.id);
  }),

  // Get referral stats for current user
  getMyReferralStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) throw new Error("User not authenticated");

    const referralProgram = await getReferralProgramByUserId(ctx.user.id);
    if (!referralProgram) {
      return {
        totalReferrals: 0,
        totalRewardValue: 0,
        referralCode: null,
      };
    }

    return {
      totalReferrals: referralProgram.totalReferrals,
      totalRewardValue: referralProgram.totalRewardValue,
      referralCode: referralProgram.referralCode,
      discountPercentage: referralProgram.discountPercentage,
    };
  }),

  // Complete a referral when referred user makes first order
  completeReferral: protectedProcedure
    .input(
      z.object({
        referredEmail: z.string().email(),
        firstOrderId: z.number(),
        rewardAmount: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const referralTracking = await getReferralTrackingByReferredEmail(input.referredEmail);
      if (!referralTracking) {
        throw new Error("Referral tracking not found");
      }

      await completeReferralTracking(
        referralTracking.id,
        input.firstOrderId,
        input.rewardAmount
      );

      return { success: true, message: "Referral completed successfully" };
    }),
});
