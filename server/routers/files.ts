import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

const FileUploadInput = z.object({
  fileName: z.string(),
  fileData: z.instanceof(Buffer),
  mimeType: z.string(),
});

export const filesRouter = router({
  upload: publicProcedure.input(FileUploadInput).mutation(async ({ input }) => {
    // Validate file type
    const allowedMimeTypes = ["image/png", "image/jpeg", "application/pdf"];
    if (!allowedMimeTypes.includes(input.mimeType)) {
      throw new Error("Invalid file type. Only PNG, JPG, and PDF are allowed.");
    }

    // Validate file size (25MB max)
    const maxFileSize = 25 * 1024 * 1024; // 25MB
    if (input.fileData.length > maxFileSize) {
      throw new Error("File size exceeds 25MB limit");
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
      throw new Error("Failed to upload file");
    }
  }),

  validateFile: publicProcedure.input(z.object({
    fileData: z.instanceof(Buffer),
    fileName: z.string(),
    mimeType: z.string(),
  })).query(async ({ input }) => {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check file type
    const allowedMimeTypes = ["image/png", "image/jpeg", "application/pdf"];
    if (!allowedMimeTypes.includes(input.mimeType)) {
      errors.push("Invalid file type. Only PNG, JPG, and PDF are allowed.");
    }

    // Check file size
    const maxFileSize = 25 * 1024 * 1024; // 25MB
    if (input.fileData.length > maxFileSize) {
      errors.push("File size exceeds 25MB limit");
    }

    // Check minimum file size (at least 1KB)
    if (input.fileData.length < 1024) {
      errors.push("File is too small");
    }

    // For images, check basic properties
    if (input.mimeType.startsWith("image/")) {
      // Check if file has minimum width (basic validation)
      // This is a simplified check - in production, you'd use image processing library
      if (input.fileData.length < 50000) {
        warnings.push("File may be too small for high-quality DTF printing. Recommended minimum: 2000px width at 300 DPI");
      }

      // PNG preferred warning for JPG
      if (input.mimeType === "image/jpeg") {
        warnings.push("PNG format with transparent background is preferred for best results");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }),
});
