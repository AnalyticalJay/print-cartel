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

    // Validate file size (50MB max)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (input.fileData.length > maxFileSize) {
      throw new Error("File size exceeds 50MB limit");
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
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (input.fileData.length > maxFileSize) {
      errors.push("File size exceeds 50MB limit");
    }

    // Check minimum file size (at least 100 bytes)
    if (input.fileData.length < 100) {
      errors.push("File is too small or empty");
    }

    // For images, provide helpful suggestions (not hard requirements)
    if (input.mimeType.startsWith("image/")) {
      // Only warn if file is very small (less than 10KB)
      if (input.fileData.length < 10000) {
        warnings.push("File is quite small. For best quality, consider using a larger design file (ideally 500KB+)");
      }

      // PNG preferred warning for JPG
      if (input.mimeType === "image/jpeg") {
        warnings.push("Tip: PNG format with transparent background often produces better results for DTF printing");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }),
});
