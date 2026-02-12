import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

const FileUploadInput = z.object({
  fileName: z.string(),
  fileData: z.instanceof(Uint8Array),
  mimeType: z.string(),
});

export const filesRouter = router({
  upload: publicProcedure.input(FileUploadInput).mutation(async ({ input }) => {
    // Only validate file size - accept any image format
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (input.fileData.length > maxFileSize) {
      throw new Error("File size exceeds 50MB limit");
    }

    // Reject empty files
    if (input.fileData.length === 0) {
      throw new Error("File is empty");
    }

    // Generate secure file key with random suffix
    const fileExtension = input.fileName.split(".").pop() || "bin";
    const randomSuffix = nanoid(8);
    const fileKey = `uploads/${Date.now()}-${randomSuffix}.${fileExtension}`;

    try {
      const { url } = await storagePut(fileKey, input.fileData, input.mimeType);
      
      return {
        success: true,
        url,
        fileKey,
        fileName: input.fileName,
        fileSize: input.fileData.length,
        mimeType: input.mimeType,
      };
    } catch (error) {
      console.error("File upload failed:", error);
      throw new Error("Failed to upload file to storage");
    }
  }),

  validateFile: publicProcedure.input(z.object({
    fileData: z.instanceof(Uint8Array),
    fileName: z.string(),
    mimeType: z.string(),
  })).query(async ({ input }) => {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Only check file size - that's the only hard requirement
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (input.fileData.length > maxFileSize) {
      errors.push("File size exceeds 50MB limit");
    }

    // Reject only completely empty files
    if (input.fileData.length === 0) {
      errors.push("File is empty");
    }

    // No warnings - accept any file format as-is
    // Quality check happens on admin side when reviewing orders

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }),
});
