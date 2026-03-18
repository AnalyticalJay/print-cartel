import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { createGangSheet, getGangSheetById, getGangSheetsByUserId, updateGangSheet, deleteGangSheet, addGangSheetArtwork, getGangSheetArtwork, updateGangSheetArtwork, deleteGangSheetArtwork, getAllGangSheets } from "../db";
import { removeBackground, validateImageQuality } from "../_core/backgroundRemoval";

const CreateGangSheetInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().min(1).default(1),
});

const AddArtworkInput = z.object({
  gangSheetId: z.number(),
  fileUrl: z.string(),
  fileName: z.string(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  originalWidth: z.number().optional(),
  originalHeight: z.number().optional(),
  dpi: z.number().default(300),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().default(0),
  zIndex: z.number().int().default(0),
});

const UpdateArtworkInput = z.object({
  id: z.number(),
  positionX: z.number().int().optional(),
  positionY: z.number().int().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  rotation: z.number().optional(),
  zIndex: z.number().int().optional(),
});

const SubmitGangSheetInput = z.object({
  gangSheetId: z.number(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  customerCompany: z.string().optional(),
  quantity: z.number().min(1),
  exportFormat: z.enum(["png", "pdf"]),
  exportFileUrl: z.string(),
  exportFileName: z.string(),
});

export const gangSheets = router({
  create: protectedProcedure
    .input(CreateGangSheetInput)
    .mutation(async ({ input, ctx }) => {
      const gangSheetId = await createGangSheet({
        userId: ctx.user!.id,
        name: input.name,
        description: input.description,
        quantity: input.quantity,
        status: "draft",
      });
      const gangSheet = await getGangSheetById(gangSheetId || 0);
      return gangSheet || { id: gangSheetId || 0 };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const gangSheet = await getGangSheetById(input.id);
      if (!gangSheet) throw new Error("Gang sheet not found");
      if (gangSheet.userId !== ctx.user!.id && ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return gangSheet;
    }),

  getByUser: protectedProcedure.query(async ({ ctx }) => {
    return getGangSheetsByUserId(ctx.user!.id);
  }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), ...CreateGangSheetInput.shape }))
    .mutation(async ({ input, ctx }) => {
      const gangSheet = await getGangSheetById(input.id);
      if (!gangSheet) throw new Error("Gang sheet not found");
      if (gangSheet.userId !== ctx.user!.id && ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const updated = await updateGangSheet(input.id, {
        name: input.name,
        description: input.description,
        quantity: input.quantity,
      });
      return updated;
    }),

  addArtwork: protectedProcedure
    .input(AddArtworkInput)
    .mutation(async ({ input, ctx }) => {
      const gangSheet = await getGangSheetById(input.gangSheetId);
      if (!gangSheet) throw new Error("Gang sheet not found");
      if (gangSheet.userId !== ctx.user!.id && ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const artwork = await addGangSheetArtwork({
        gangSheetId: input.gangSheetId,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        originalWidth: input.originalWidth,
        originalHeight: input.originalHeight,
        dpi: input.dpi,
        positionX: input.positionX.toString(),
        positionY: input.positionY.toString(),
        width: input.width.toString(),
        height: input.height.toString(),
        rotation: input.rotation.toString(),
        zIndex: input.zIndex,
      });
      return artwork;
    }),

  getArtwork: protectedProcedure
    .input(z.object({ gangSheetId: z.number() }))
    .query(async ({ input, ctx }) => {
      const gangSheet = await getGangSheetById(input.gangSheetId);
      if (!gangSheet) throw new Error("Gang sheet not found");
      if (gangSheet.userId !== ctx.user!.id && ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return getGangSheetArtwork(input.gangSheetId);
    }),

  updateArtwork: protectedProcedure
    .input(UpdateArtworkInput)
    .mutation(async ({ input }) => {
      const updateData: Partial<Record<string, any>> = {};
      if (input.positionX !== undefined) updateData.positionX = input.positionX.toString();
      if (input.positionY !== undefined) updateData.positionY = input.positionY.toString();
      if (input.width !== undefined) updateData.width = input.width.toString();
      if (input.height !== undefined) updateData.height = input.height.toString();
      if (input.rotation !== undefined) updateData.rotation = input.rotation.toString();
      if (input.zIndex !== undefined) updateData.zIndex = input.zIndex;
      return updateGangSheetArtwork(input.id, updateData);
    }),

  deleteArtwork: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteGangSheetArtwork(input.id);
      return { success: true };
    }),

  submit: protectedProcedure
    .input(SubmitGangSheetInput)
    .mutation(async ({ input }) => {
      const gangSheet = await updateGangSheet(input.gangSheetId, {
        status: "submitted",
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        customerCompany: input.customerCompany,
        quantity: input.quantity,
        exportFileUrl: input.exportFileUrl,
        exportFileName: input.exportFileName,
        exportFormat: input.exportFormat,
      });

      return { success: true, gangSheetId: input.gangSheetId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const gangSheet = await getGangSheetById(input.id);
      if (!gangSheet) throw new Error("Gang sheet not found");
      if (gangSheet.userId !== ctx.user!.id && ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      await deleteGangSheet(input.id);
      return { success: true };
    }),

  removeBackground: protectedProcedure
    .input(z.object({ imageUrl: z.string().url() }))
    .mutation(async ({ input }) => {
      try {
        const processedImage = await removeBackground(input.imageUrl);
        return { success: true, imageUrl: processedImage };
      } catch (error) {
        throw new Error("Background removal failed");
      }
    }),

  validateImageQuality: publicProcedure
    .input(z.object({ width: z.number(), height: z.number(), dpi: z.number().optional() }))
    .query(({ input }) => {
      return validateImageQuality(input.width, input.height, input.dpi);
    }),

  listAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
    return getAllGangSheets();
  }),
});
