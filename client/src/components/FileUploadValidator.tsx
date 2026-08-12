"use client";

import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  FileIcon,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { createBackgroundRemovedFile, isImageFile } from "@/lib/artworkProcessing";
import { toast } from "sonner";

// Check image resolution for print quality.
const checkImageResolution = async (
  file: File
): Promise<{ width: number; height: number; warning?: string }> => {
  return new Promise((resolve) => {
    if (!isImageFile(file)) {
      resolve({ width: 0, height: 0 });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new Image();
      image.onload = () => {
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        const totalPixels = width * height;
        const minimumPixelsForPrint = 300000;
        let warning: string | undefined;

        if (totalPixels < minimumPixelsForPrint) {
          const minimumDimension = Math.ceil(Math.sqrt(minimumPixelsForPrint));
          warning = `Low resolution detected (${width}×${height}px). For best print quality, use an image at least ${minimumDimension}×${minimumDimension}px or 300 DPI.`;
        } else if (width < 200 || height < 200) {
          warning = `Image is quite small (${width}×${height}px). Consider using a larger file for better print quality.`;
        }

        resolve({ width, height, warning });
      };
      image.onerror = () => resolve({ width: 0, height: 0 });
      image.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

interface FileUploadValidatorProps {
  placement: string;
  printSize: string;
  /** Called after successful S3 upload with the file object and S3 URL. */
  onFileUpload: (file: File, s3Url: string) => void;
  uploadedFileName?: string;
  uploadedFileUrl?: string;
  onRemoveFile?: () => void;
}

export function FileUploadValidator({
  placement,
  printSize,
  onFileUpload,
  uploadedFileName,
  uploadedFileUrl,
  onRemoveFile,
}: FileUploadValidatorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [backgroundRemovalProgress, setBackgroundRemovalProgress] = useState(0);
  const [resolutionWarning, setResolutionWarning] = useState<string | undefined>();
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [activeFileName, setActiveFileName] = useState(uploadedFileName);
  const [activeFileUrl, setActiveFileUrl] = useState(uploadedFileUrl);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalFileName, setOriginalFileName] = useState(uploadedFileName);
  const [originalFileUrl, setOriginalFileUrl] = useState(uploadedFileUrl);
  const [backgroundRemoved, setBackgroundRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.files.upload.useMutation();

  const uploadFileToStorage = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    const result = await uploadMutation.mutateAsync({
      fileName: file.name,
      fileData,
      mimeType: file.type || "application/octet-stream",
    });

    return result.url;
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const validateAndUploadFile = async (file: File) => {
    const maxFileSize = 50 * 1024 * 1024;
    if (file.size > maxFileSize) {
      toast.error("File size exceeds the 50MB limit");
      return;
    }
    if (file.size === 0) {
      toast.error("File is empty");
      return;
    }

    if (isImageFile(file)) {
      const resolution = await checkImageResolution(file);
      if (resolution.warning) {
        setResolutionWarning(resolution.warning);
        toast.warning(resolution.warning);
      } else {
        setResolutionWarning(undefined);
      }
    } else {
      setResolutionWarning(undefined);
    }

    setIsUploading(true);
    try {
      const s3Url = await uploadFileToStorage(file);
      setActiveFile(file);
      setActiveFileName(file.name);
      setActiveFileUrl(s3Url);
      setOriginalFile(file);
      setOriginalFileName(file.name);
      setOriginalFileUrl(s3Url);
      setBackgroundRemoved(false);
      onFileUpload(file, s3Url);
      toast.success(`"${file.name}" uploaded successfully`);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!activeFile || !isImageFile(activeFile)) {
      toast.error("Background removal is available for image files only.");
      return;
    }

    setIsRemovingBackground(true);
    setBackgroundRemovalProgress(0);
    try {
      // Load the AI model only when the user requests this optional feature.
      const { removeBackground } = await import("@imgly/background-removal");
      const processedBlob = await removeBackground(activeFile, {
        model: "isnet_fp16",
        output: {
          format: "image/png",
        },
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) {
            setBackgroundRemovalProgress(Math.round((current / total) * 100));
          }
        },
      });

      const processedFile = createBackgroundRemovedFile(processedBlob, activeFile.name);

      setIsUploading(true);
      const processedUrl = await uploadFileToStorage(processedFile);
      setActiveFile(processedFile);
      setActiveFileName(processedFile.name);
      setActiveFileUrl(processedUrl);
      setBackgroundRemoved(true);
      onFileUpload(processedFile, processedUrl);
      toast.success("Background removed — transparent artwork is ready to print.");
    } catch (error) {
      console.error("Background removal failed:", error);
      toast.error("We couldn't remove the background. You can keep the original design or try again.");
    } finally {
      setIsUploading(false);
      setIsRemovingBackground(false);
      setBackgroundRemovalProgress(0);
    }
  };

  const handleKeepOriginal = () => {
    if (!originalFile || !originalFileUrl) return;

    setActiveFile(originalFile);
    setActiveFileName(originalFileName);
    setActiveFileUrl(originalFileUrl);
    setBackgroundRemoved(false);
    onFileUpload(originalFile, originalFileUrl);
    toast.success("Original artwork restored.");
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      await validateAndUploadFile(files[0]);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (files && files.length > 0) {
      await validateAndUploadFile(files[0]);
    }
    event.currentTarget.value = "";
  };

  const handleClick = () => {
    if (!isUploading && !isRemovingBackground) {
      fileInputRef.current?.click();
    }
  };

  const displayedFileName = activeFileName || uploadedFileName;
  const displayedFileUrl = activeFileUrl || uploadedFileUrl;
  const canRemoveBackground = Boolean(
    displayedFileName &&
      ((activeFile && isImageFile(activeFile)) ||
        displayedFileUrl?.match(/\.(png|jpe?g|webp|gif|bmp|avif)(\?|$)/i))
  );
  const isBusy = isUploading || isRemovingBackground;

  const handleRemoveFile = () => {
    if (isBusy) return;
    setActiveFile(null);
    setActiveFileName(undefined);
    setActiveFileUrl(undefined);
    setOriginalFile(null);
    setOriginalFileName(undefined);
    setOriginalFileUrl(undefined);
    setBackgroundRemoved(false);
    setResolutionWarning(undefined);
    onRemoveFile?.();
  };

  return (
    <Card className="bg-gray-700 border-gray-600">
      <CardContent className="pt-4 md:pt-6">
        <div className="space-y-3 md:space-y-4">
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

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.ai,.eps,.svg"
            disabled={isBusy}
          />

          {!displayedFileName ? (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleClick}
              className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-all ${
                isBusy
                  ? "border-accent/50 bg-accent/5 cursor-wait"
                  : isDragging
                    ? "border-accent bg-accent/10 cursor-copy"
                    : "border-gray-600 hover:border-gray-500 bg-gray-600/30 hover:bg-gray-600/50 cursor-pointer active:bg-accent/10"
              }`}
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-8 md:w-10 h-8 md:h-10 mx-auto text-accent mb-2 md:mb-3 animate-spin" />
                  <p className="text-white font-semibold mb-1 text-sm md:text-base">
                    Uploading artwork...
                  </p>
                  <p className="text-gray-300 text-xs md:text-sm">Please wait</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 md:w-10 h-8 md:h-10 mx-auto text-gray-300 mb-2 md:mb-3" />
                  <p className="text-white font-semibold mb-1 text-sm md:text-base">
                    Drag and drop your file here
                  </p>
                  <p className="text-gray-300 text-xs md:text-sm mb-2 md:mb-3">or click to browse</p>
                  <p className="text-gray-400 text-xs">
                    Supported: PNG, JPG, PDF, AI, EPS, SVG • Max 50MB
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {resolutionWarning && (
                <div className="bg-yellow-900/40 border border-yellow-600/60 rounded-lg p-3 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-200 text-xs">{resolutionWarning}</p>
                </div>
              )}

              <div className="border border-accent/50 rounded-lg p-3 md:p-4 bg-accent/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    {displayedFileUrl && canRemoveBackground ? (
                      <div className="w-12 h-12 rounded-md overflow-hidden border border-gray-500 bg-[linear-gradient(45deg,#d1d5db_25%,transparent_25%),linear-gradient(-45deg,#d1d5db_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#d1d5db_75%),linear-gradient(-45deg,transparent_75%,#d1d5db_75%)] bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0px] flex-shrink-0">
                        <img
                          src={displayedFileUrl}
                          alt="Uploaded artwork preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <FileIcon className="w-5 h-5 text-accent flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold truncate text-xs md:text-sm">
                        {displayedFileName}
                      </p>
                      {displayedFileUrl ? (
                        <a
                          href={displayedFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent text-xs hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Uploaded to server ✓
                        </a>
                      ) : (
                        <p className="text-yellow-400 text-xs">Pending upload...</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                    <button
                      onClick={handleClick}
                      disabled={isBusy}
                      className="text-xs md:text-sm px-2 md:px-3 py-1 rounded bg-accent/20 text-accent hover:bg-accent/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      title="Replace with a different file"
                      aria-label="Replace file"
                    >
                      Replace
                    </button>
                    <button
                      onClick={handleRemoveFile}
                      disabled={isBusy}
                      className="text-red-400 hover:text-red-300 p-1.5 md:p-1 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove file"
                      aria-label="Remove file"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {canRemoveBackground && (
                <div className="rounded-lg border border-purple-400/40 bg-purple-950/30 p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex gap-2">
                      <Sparkles className="w-5 h-5 text-purple-300 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-purple-100 text-sm font-semibold">
                          Remove background with AI
                        </p>
                        <p className="text-purple-200/80 text-xs mt-1">
                          Create a transparent PNG so your logo prints without a white box. Your image is processed privately in this browser.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {backgroundRemoved && originalFile && (
                        <button
                          onClick={handleKeepOriginal}
                          disabled={isBusy}
                          className="text-xs px-3 py-2 rounded-md border border-gray-500 text-gray-200 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
                        >
                          Keep original
                        </button>
                      )}
                      <button
                        onClick={handleRemoveBackground}
                        disabled={isBusy || backgroundRemoved}
                        className="inline-flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-md bg-purple-500 text-white hover:bg-purple-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {isRemovingBackground ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {backgroundRemovalProgress > 0 ? `${backgroundRemovalProgress}%` : "Processing"}
                          </>
                        ) : backgroundRemoved ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Background removed
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Remove background
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  {isRemovingBackground && (
                    <p className="text-purple-200/80 text-xs mt-3">
                      The first run may take a little longer while the AI model is downloaded and cached.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

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
