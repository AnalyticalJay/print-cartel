import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface UploadedFile {
  name: string;
  url: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
}

interface FileUploadZoneProps {
  onFileUpload?: (file: UploadedFile) => void;
  onValidationWarnings?: (warnings: string[]) => void;
  maxFiles?: number;
}

export function FileUploadZone({
  onFileUpload,
  onValidationWarnings,
  maxFiles = 1,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.files.upload.useMutation();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const performClientValidation = (file: File): { valid: boolean; warnings: string[] } => {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check file type
    const allowedMimeTypes = ["image/png", "image/jpeg", "application/pdf"];
    if (!allowedMimeTypes.includes(file.type)) {
      errors.push("Invalid file type. Only PNG, JPG, and PDF are allowed.");
    }

    // Check file size
    const maxFileSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxFileSize) {
      errors.push("File size exceeds 25MB limit");
    }

    // Check minimum file size
    if (file.size < 1024) {
      errors.push("File is too small");
    }

    // For images, check basic properties
    if (file.type.startsWith("image/")) {
      if (file.size < 50000) {
        warnings.push("File may be too small for high-quality DTF printing. Recommended minimum: 2000px width at 300 DPI");
      }

      if (file.type === "image/jpeg") {
        warnings.push("PNG format with transparent background is preferred for best results");
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
    };
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file before upload
    const validation = performClientValidation(file);

    if (!validation.valid) {
      toast.error("File validation failed. Please check the requirements.");
      return;
    }

    if (validation.warnings.length > 0) {
      setValidationWarnings(validation.warnings);
      onValidationWarnings?.(validation.warnings);
    }

    // Upload file
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const buffer = await file.arrayBuffer();

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const result = await uploadMutation.mutateAsync({
        fileName: file.name,
        fileData: Buffer.from(buffer),
        mimeType: file.type,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const uploadedFile: UploadedFile = {
        name: result.fileName,
        url: result.url,
        fileKey: result.fileKey,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
      };

      setUploadedFiles([...uploadedFiles, uploadedFile]);
      onFileUpload?.(uploadedFile);

      toast.success("File uploaded successfully!");

      // Reset after a short delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      toast.error("Failed to upload file. Please try again.");
      console.error("Upload error:", error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (uploadedFiles.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} file(s) allowed`);
      return;
    }

    handleFileUpload(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadedFiles.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} file(s) allowed`);
      return;
    }
    handleFileUpload(e.target.files);
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setValidationWarnings([]);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {uploadedFiles.length < maxFiles && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-white bg-gray-700"
              : "border-gray-600 bg-gray-800 hover:border-gray-500"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={handleInputChange}
            className="hidden"
            disabled={isUploading}
          />

          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />

          <h3 className="text-lg font-semibold text-white mb-2">
            {isUploading ? "Uploading..." : "Drop your design file here"}
          </h3>

          <p className="text-gray-400 mb-4">
            or{" "}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-white hover:underline disabled:opacity-50"
            >
              click to browse
            </button>
          </p>

          <p className="text-sm text-gray-500">
            PNG, JPG, or PDF • Max 25MB • Minimum 2000px width recommended
          </p>

          {isUploading && (
            <div className="mt-4 space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-gray-400">{uploadProgress}%</p>
            </div>
          )}
        </div>
      )}

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <Alert className="bg-yellow-900/20 border-yellow-700">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-600 ml-2">
            <div className="font-semibold mb-2">File Quality Warning:</div>
            <ul className="list-disc list-inside space-y-1">
              {validationWarnings.map((warning, index) => (
                <li key={index} className="text-sm">
                  {warning}
                </li>
              ))}
            </ul>
            <p className="text-xs mt-2 text-yellow-500">
              ⚠ Uploaded file may not be suitable for high quality DTF printing.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white font-semibold">Uploaded Files:</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-700 p-4 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-white truncate font-medium">{file.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                onClick={() => removeFile(index)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 flex-shrink-0"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* File Requirements */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h4 className="text-white font-semibold mb-2">File Requirements:</h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>✓ Format: PNG (preferred with transparent background), JPG, or PDF</li>
          <li>✓ Minimum width: 2000 pixels</li>
          <li>✓ Minimum DPI: 300</li>
          <li>✓ Maximum file size: 25MB</li>
        </ul>
      </div>
    </div>
  );
}
