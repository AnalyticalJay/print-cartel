import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { createGangSheet, getGangSheetById, getGangSheetsByUserId, updateGangSheet, deleteGangSheet, addGangSheetArtwork, getGangSheetArtwork, updateGangSheetArtwork, deleteGangSheetArtwork, getAllGangSheets } from "../db";

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
  width: z.number(),
  height: z.number(),
  rotation: z.number().default(0),
  zIndex: z.number().default(0),
});

const UpdateArtworkInput = z.object({
  id: z.number(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  zIndex: z.number().optional(),
});

const SubmitGangSheetInput = z.object({
  gangSheetId: z.number(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string(),
  customerCompany: z.string().optional(),
  quantity: z.number().min(1),
  exportFormat: z.enum(["png", "pdf"]).default("png"),
  exportFileUrl: z.string(),
  exportFileName: z.string(),
});

export const gangSheetsRouter = router({
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
      return { id: gangSheetId };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const gangSheet = await getGangSheetById(input.id);
      if (!gangSheet) throw new Error("Gang sheet not found");
      if (gangSheet.userId !== ctx.user!.id && ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      const artwork = await getGangSheetArtwork(input.id);
      return { ...gangSheet, artwork };
    }),

  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    return getGangSheetsByUserId(ctx.user!.id);
  }),

  addArtwork: protectedProcedure
    .input(AddArtworkInput)
    .mutation(async ({ input, ctx }) => {
      const gangSheet = await getGangSheetById(input.gangSheetId);
      if (!gangSheet) throw new Error("Gang sheet not found");
      if (gangSheet.userId !== ctx.user!.id) throw new Error("Unauthorized");

      const artworkId = await addGangSheetArtwork({
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
      return { id: artworkId };
    }),

  updateArtwork: protectedProcedure
    .input(UpdateArtworkInput)
    .mutation(async ({ input, ctx }) => {
      const artwork = await getGangSheetArtwork(0); // Placeholder - would need to fetch artwork first
      // In production, verify ownership
      await updateGangSheetArtwork(input.id, {
        positionX: input.positionX?.toString(),
        positionY: input.positionY?.toString(),
        width: input.width?.toString(),
        height: input.height?.toString(),
        rotation: input.rotation?.toString(),
        zIndex: input.zIndex,
      });
      return { success: true };
    }),

  deleteArtwork: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteGangSheetArtwork(input.id);
      return { success: true };
    }),

  submit: protectedProcedure
    .input(SubmitGangSheetInput)
    .mutation(async ({ input, ctx }) => {
      const gangSheet = await getGangSheetById(input.gangSheetId);
      if (!gangSheet) throw new Error("Gang sheet not found");
      if (gangSheet.userId !== ctx.user!.id) throw new Error("Unauthorized");

      await updateGangSheet(input.gangSheetId, {
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

  // Admin procedures
  listAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
    return getAllGangSheets();
  }),
});
