import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle, X } from "lucide-react";
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
  onPreviewReady?: (imageUrl: string, fileName: string) => void;
  maxFiles?: number;
  placementId?: number;
}

export function FileUploadZone({
  onFileUpload,
  onValidationWarnings,
  onPreviewReady,
  maxFiles = 1,
  placementId,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

  const performClientValidation = (file: File): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Only check file size - that's the only hard requirement
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
      errors.push("File size exceeds 50MB limit");
    }

    // Reject only completely empty files
    if (file.size === 0) {
      errors.push("File is empty");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file before upload
    const validation = performClientValidation(file);

    if (!validation.valid) {
      validation.errors.forEach(error => {
        toast.error(error);
      });
      return;
    }

    // Upload file
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const result = await uploadMutation.mutateAsync({
        fileName: file.name,
        fileData: uint8Array,
        mimeType: file.type || "application/octet-stream",
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
      
      // Emit preview ready callback for real-time preview
      if (onPreviewReady) {
        onPreviewReady(result.url, result.fileName);
      }

      toast.success("File uploaded successfully!");

      // Reset after a short delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
      toast.error(errorMessage);
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
            onChange={handleInputChange}
            className="hidden"
            accept="*/*"
          />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-white font-semibold mb-2">Drag and drop your design file</p>
          <p className="text-gray-400 text-sm mb-4">or click to browse (Max 50MB)</p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="border-gray-600 text-gray-400 hover:text-white"
            disabled={isUploading}
          >
            Choose File
          </Button>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-white text-sm mb-2">Uploading...</p>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{file.name}</p>
                  <p className="text-gray-400 text-xs">
                    {(file.fileSize / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                onClick={() => removeFile(index)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Info Message */}
      <Alert className="bg-blue-900 border-blue-700">
        <AlertCircle className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200 text-sm">
          Upload any image format (PNG, JPG, PDF, WebP, etc.). We'll review the artwork quality when processing your order.
        </AlertDescription>
      </Alert>
    </div>
  );
}
