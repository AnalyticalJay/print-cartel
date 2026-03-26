"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, AlertCircle, CheckCircle, FileIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface FileUploadValidatorProps {
  placement: string;
  printSize: string;
  onFileUpload: (file: File) => void;
  uploadedFileName?: string;
  onRemoveFile?: () => void;
}

export function FileUploadValidator({
  placement,
  printSize,
  onFileUpload,
  uploadedFileName,
  onRemoveFile,
}: FileUploadValidatorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const validateFileMutation = trpc.files.validateFile.useQuery(
    { fileData: new Uint8Array(), fileName: "", mimeType: "" },
    { enabled: false }
  );

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

  const validateAndUploadFile = async (file: File) => {
    // Quick client-side validation
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
      toast.error("File size exceeds 50MB limit");
      return;
    }

    if (file.size === 0) {
      toast.error("File is empty");
      return;
    }

    // Accept file and pass to parent
    onFileUpload(file);
    toast.success(`File "${file.name}" selected`);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await validateAndUploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      await validateAndUploadFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="bg-gray-700 border-gray-600">
      <CardContent className="pt-4 md:pt-6">
        <div className="space-y-3 md:space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-white font-semibold text-sm md:text-base">
                {placement} - {printSize}
              </h3>
              <p className="text-gray-300 text-xs md:text-sm">
                Upload your design file (PNG, JPG, PDF, etc.)
              </p>
            </div>
          </div>

          {/* Upload Area */}
          {!uploadedFileName ? (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleClick}
              className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center cursor-pointer transition-all active:bg-accent/10 ${
                isDragging
                  ? "border-accent bg-accent/10"
                  : "border-gray-600 hover:border-gray-500 bg-gray-600/30 hover:bg-gray-600/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf"
              />

              <Upload className="w-8 md:w-10 h-8 md:h-10 mx-auto text-gray-300 mb-2 md:mb-3" />
              <p className="text-white font-semibold mb-1 text-sm md:text-base">
                Drag and drop your file here
              </p>
              <p className="text-gray-300 text-xs md:text-sm mb-2 md:mb-3">or click to browse</p>
              <p className="text-gray-400 text-xs">
                Supported: PNG, JPG, PDF, WebP • Max 50MB
              </p>
            </div>
          ) : (
            <div className="border border-accent/50 rounded-lg p-3 md:p-4 bg-accent/5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <FileIcon className="w-5 h-5 text-accent flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold truncate text-xs md:text-sm">
                      {uploadedFileName}
                    </p>
                    <p className="text-accent text-xs">File ready for upload</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2 ml-2 flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  {onRemoveFile && (
                    <button
                      onClick={onRemoveFile}
                      className="text-red-400 hover:text-red-300 p-1.5 md:p-1 active:scale-95"
                      title="Remove file"
                      aria-label="Remove file"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-2 md:p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-200">
                <p className="font-semibold mb-1 text-xs md:text-sm">Design Requirements:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>300 DPI recommended</li>
                  <li>PNG (transparent) or white background</li>
                  <li>RGB color mode</li>
                  <li>0.5cm bleed margin</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
