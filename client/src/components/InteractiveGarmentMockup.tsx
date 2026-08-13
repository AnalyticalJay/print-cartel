import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Grid3X3,
  Image as ImageIcon,
  Loader2,
  Minus,
  Move,
  Pencil,
  Plus,
  RotateCcw,
  RotateCw,
  Crosshair,
  Upload,
} from "lucide-react";
import {
  clampPreviewPosition,
  clampPreviewScale,
  getPlacementRegion,
  getPreviewOffsetLimits,
  nudgePreviewPosition,
  normalizePreviewRotation,
  snapPreviewPosition,
} from "@/lib/mockupGeometry";
import { convertCentimetresToInches, getArtworkDimensions } from "@/lib/mockupDimensions";
import { getGridContrastColors } from "@/lib/gridContrast";
import {
  getMockupPreviewVisibility,
  getMockupUploadButtonState,
  getSelectedMockupGarmentColor,
  isMockupAutoRotateActive,
} from "@/lib/mockupPreview";
import { ColorSelector } from "@/components/ColorSelector";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Placement {
  id: number;
  placementName: string;
}

interface PrintOption {
  id: number;
  printSize: string;
}

interface GarmentColorOption {
  id: number;
  productId: number;
  colorName: string;
  colorHex: string;
}

type DimensionUnit = "cm" | "in";

export interface InteractivePrintSelection {
  placementId: number;
  printSizeId: number;
  uploadedFilePath?: string;
  uploadedFileName?: string;
  previewX?: number;
  previewY?: number;
  previewScale?: number;
  previewRotation?: number;
}

interface InteractiveGarmentMockupProps {
  productName?: string;
  productImageUrl?: string | null;
  garmentColor?: string;
  colorOptions?: GarmentColorOption[];
  selectedColorId?: number | null;
  placements: Placement[];
  printOptions?: PrintOption[];
  printSelections: InteractivePrintSelection[];
  onPositionChange: (placementId: number, x: number, y: number) => void;
  onScaleChange: (placementId: number, scale: number) => void;
  onRotationChange: (placementId: number, rotation: number) => void;
  onGarmentColorChange?: (colorId: number) => void;
  onArtworkUpload?: (placementId: number, file: File, s3Url: string) => void;
}

interface DragState {
  placementId: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
}

export function InteractiveGarmentMockup({
  productName = "Selected garment",
  garmentColor = "#d1d5db",
  colorOptions = [],
  selectedColorId = null,
  placements,
  printOptions = [],
  printSelections,
  onPositionChange,
  onScaleChange,
  onRotationChange,
  onGarmentColorChange,
  onArtworkUpload,
}: InteractiveGarmentMockupProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const directUploadInputRef = useRef<HTMLInputElement>(null);
  const [activePlacementId, setActivePlacementId] = useState<number | null>(
    printSelections[0]?.placementId ?? placements[0]?.id ?? null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>("cm");
  const [showAlignmentGrid, setShowAlignmentGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [isMockupPreview, setIsMockupPreview] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isDirectUploading, setIsDirectUploading] = useState(false);
  const [uploadPlacementId, setUploadPlacementId] = useState<number | null>(null);
  const directUploadMutation = trpc.files.upload.useMutation();

  const selectionByPlacement = useMemo(
    () => new Map(printSelections.map((selection) => [selection.placementId, selection])),
    [printSelections]
  );

  const getSelection = (placementId: number) => selectionByPlacement.get(placementId);
  const activeSelection = activePlacementId === null ? undefined : getSelection(activePlacementId);
  const activePrintOption = printOptions.find((option) => option.id === activeSelection?.printSizeId);
  const activeArtworkDimensions = getArtworkDimensions(
    activePrintOption?.printSize,
    activeSelection?.previewScale ?? 1
  );
  const displayedArtworkDimensions = dimensionUnit === "cm"
    ? { width: activeArtworkDimensions.widthCm, height: activeArtworkDimensions.heightCm }
    : {
        width: convertCentimetresToInches(activeArtworkDimensions.widthCm),
        height: convertCentimetresToInches(activeArtworkDimensions.heightCm),
      };
  const activePlacement = activePlacementId === null
    ? undefined
    : placements.find((placement) => placement.id === activePlacementId);
  const activePlacementRegion = activePlacement
    ? getPlacementRegion(activePlacement.placementName)
    : undefined;
  const previewGarmentColor = getSelectedMockupGarmentColor(colorOptions, selectedColorId, garmentColor);
  const gridContrast = getGridContrastColors(previewGarmentColor);
  const previewVisibility = getMockupPreviewVisibility(isMockupPreview, showAlignmentGrid);
  const autoRotateActive = isMockupAutoRotateActive(isMockupPreview, isAutoRotating);

  const toggleMockupPreview = () => {
    if (isMockupPreview) setIsAutoRotating(false);
    setIsMockupPreview((preview) => !preview);
  };

  const openArtworkPicker = (placementId: number) => {
    if (!onArtworkUpload || isDirectUploading) return;
    setActivePlacementId(placementId);
    setUploadPlacementId(placementId);
    directUploadInputRef.current?.click();
  };

  const handleDirectArtworkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    const targetPlacementId = uploadPlacementId ?? activePlacementId;

    if (!file || targetPlacementId === null || !onArtworkUpload) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file for the garment preview.");
      return;
    }
    if (file.size === 0 || file.size > 50 * 1024 * 1024) {
      toast.error("Please choose an image between 1 byte and 50MB.");
      return;
    }

    setIsDirectUploading(true);
    try {
      const fileData = new Uint8Array(await file.arrayBuffer());
      const result = await directUploadMutation.mutateAsync({
        fileName: file.name,
        fileData,
        mimeType: file.type,
      });
      onArtworkUpload(targetPlacementId, file, result.url);
      const targetPlacement = placements.find((placement) => placement.id === targetPlacementId);
      toast.success(`Artwork applied to ${targetPlacement?.placementName || "the selected placement"}.`);
    } catch (error) {
      console.error("Direct artwork upload failed:", error);
      toast.error("Artwork upload failed. Please try again.");
    } finally {
      setIsDirectUploading(false);
      setUploadPlacementId(null);
    }
  };

  const nudgeArtworkPosition = (placementId: number, deltaX: number, deltaY: number) => {
    const selection = getSelection(placementId);
    const placement = placements.find((item) => item.id === placementId);
    if (!selection || !placement) return;

    const region = getPlacementRegion(placement.placementName);
    const limits = getPreviewOffsetLimits(
      region.width,
      region.height,
      selection.previewScale ?? 1,
      selection.previewRotation ?? 0
    );
    const position = nudgePreviewPosition(
      selection.previewX ?? 0,
      selection.previewY ?? 0,
      deltaX,
      deltaY,
      limits
    );
    onPositionChange(placementId, position.x, position.y);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>, placementId: number) => {
    const selection = getSelection(placementId);
    if (!selection?.uploadedFilePath || !stageRef.current) {
      setActivePlacementId(placementId);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setActivePlacementId(placementId);
    const rect = stageRef.current.getBoundingClientRect();
    dragRef.current = {
      placementId,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: selection.previewX ?? 0,
      startY: selection.previewY ?? 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    // Read the rect here so the browser calculates it before the next pointer move.
    void rect;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !stage) return;

    event.preventDefault();
    const rect = stage.getBoundingClientRect();
    const placement = placements.find((item) => item.id === drag.placementId);
    const selection = getSelection(drag.placementId);
    const region = placement ? getPlacementRegion(placement.placementName) : getPlacementRegion("Front");
    const limits = getPreviewOffsetLimits(
      region.width,
      region.height,
      selection?.previewScale ?? 1,
      selection?.previewRotation ?? 0
    );
    const deltaX = ((event.clientX - drag.startClientX) / rect.width) * 100;
    const deltaY = ((event.clientY - drag.startClientY) / rect.height) * 100;

    const nextX = clampPreviewPosition(drag.startX + deltaX, limits.x);
    const nextY = clampPreviewPosition(drag.startY + deltaY, limits.y);
    const snappedPosition = snapToGrid
      ? snapPreviewPosition(nextX, nextY, region.width, region.height)
      : { x: nextX, y: nextY };

    onPositionChange(
      drag.placementId,
      clampPreviewPosition(snappedPosition.x, limits.x),
      clampPreviewPosition(snappedPosition.y, limits.y)
    );
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setIsDragging(false);
    }
  };

  return (
    <div className="rounded-2xl border border-accent/30 bg-gray-900/80 p-4 md:p-6 shadow-xl">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-white md:text-lg">Preview your design on the garment</h3>
          <p className="text-xs text-gray-300 md:text-sm">
            Tap a placement, then drag your artwork to position it. This preview is a placement guide, not a colour-proof.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isMockupPreview && (
            <div className="flex items-center gap-1.5 text-xs text-accent">
              <Move className="h-4 w-4" />
              <span>Drag to position</span>
            </div>
          )}
          <button
            type="button"
            aria-pressed={isMockupPreview}
            onClick={toggleMockupPreview}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              isMockupPreview
                ? "border-accent bg-accent text-gray-950"
                : "border-accent/60 bg-accent/10 text-accent hover:bg-accent/20"
            }`}
          >
            {isMockupPreview ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isMockupPreview ? "Back to editing" : "Preview mockup"}
          </button>
          {isMockupPreview && (
            <button
              type="button"
              aria-pressed={isAutoRotating}
              onClick={() => setIsAutoRotating((rotating) => !rotating)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                isAutoRotating
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-gray-600 bg-gray-800 text-gray-200 hover:border-accent/60 hover:text-white"
              }`}
            >
              <RotateCw className={`h-4 w-4 ${isAutoRotating ? "animate-spin" : ""}`} />
              Auto-rotate
              <span className="text-[10px] font-bold uppercase tracking-wide">{isAutoRotating ? "On" : "Off"}</span>
            </button>
          )}
        </div>
      </div>

      <div className={isMockupPreview ? "block" : "grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start"}>
        <div
          ref={stageRef}
          className={`relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white via-slate-50 to-slate-200 shadow-2xl select-none ${
            isMockupPreview ? "max-w-[560px] border-transparent" : "max-w-[480px] lg:sticky lg:top-6"
          } ${
            isDragging && !isMockupPreview ? "cursor-grabbing border-accent" : "border-gray-300"
          }`}
          style={{ touchAction: "none" }}
        >
          {!isMockupPreview && (
            <div className="pointer-events-none absolute left-3 top-3 z-30 rounded-full border border-white/80 bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 shadow-sm backdrop-blur-sm">
              Unisex classic-fit T-shirt
            </div>
          )}
          {!isMockupPreview && onArtworkUpload && (
            <input
              ref={directUploadInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleDirectArtworkUpload}
            />
          )}

          <div className={`absolute inset-0 ${autoRotateActive ? "mockup-auto-rotate" : ""}`}>
          <svg viewBox="0 0 100 125" className="absolute inset-0 h-full w-full p-3 md:p-5" aria-label="Standard unisex classic-fit T-shirt mockup">
              <defs>
                <linearGradient id="garmentBodyGradient" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor={previewGarmentColor} />
                  <stop offset="0.52" stopColor="#ffffff" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#64748b" stopOpacity="0.38" />
                </linearGradient>
                <linearGradient id="garmentSleeveGradient" x1="0" x2="1">
                  <stop offset="0" stopColor="#64748b" stopOpacity="0.35" />
                  <stop offset="0.45" stopColor={previewGarmentColor} />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0.35" />
                </linearGradient>
                <filter id="garmentShadow" x="-30%" y="-30%" width="160%" height="170%">
                  <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.25" />
                </filter>
              </defs>
              <path
                d="M34 15 23 20 8 38l15 10 9-11v72h36V37l9 11 15-10-15-18-11-5c-2 8-8 12-16 12s-14-4-16-12Z"
                fill="url(#garmentBodyGradient)"
                stroke="#64748b"
                strokeWidth="0.8"
                filter="url(#garmentShadow)"
              />
              <path d="M8 38 23 48l9-11v72" fill="none" stroke="url(#garmentSleeveGradient)" strokeWidth="2" opacity="0.8" />
              <path d="M92 38 77 48l-9-11v72" fill="none" stroke="#475569" strokeWidth="1.3" opacity="0.55" />
              <path d="M39 16c1 7 5 11 11 11s10-4 11-11" fill="none" stroke="#475569" strokeWidth="1" />
              <path d="M32 37v72M68 37v72" stroke="#64748b" strokeWidth="0.55" opacity="0.45" />
              <path d="M34 103h32" stroke="#475569" strokeWidth="0.8" opacity="0.5" />
            </svg>

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_18%,rgba(255,255,255,0.62),transparent_32%),linear-gradient(145deg,rgba(255,255,255,0.15),transparent_48%,rgba(15,23,42,0.1))]" />

          {previewVisibility.showGuides && placements.map((placement) => {
            const region = getPlacementRegion(placement.placementName);
            const selection = getSelection(placement.id);
            const isActive = activePlacementId === placement.id;
            const hasArtwork = Boolean(selection?.uploadedFilePath);

            const placementUploadState = getMockupUploadButtonState(
              placement.id,
              hasArtwork,
              isDirectUploading
            );

            return (
              <div
                key={`region-${placement.id}`}
                className="absolute z-10"
                style={{
                  left: `${region.left}%`,
                  top: `${region.top}%`,
                  width: `${region.width}%`,
                  height: `${region.height}%`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setActivePlacementId(placement.id)}
                  className={`absolute inset-0 w-full rounded-md border-2 border-dashed transition-all ${
                    isActive
                      ? "border-accent bg-accent/10 shadow-[0_0_0_2px_rgba(255,212,0,0.25)]"
                      : hasArtwork
                        ? "border-emerald-400/70 bg-emerald-400/5"
                        : "border-gray-500/70 bg-gray-500/5 hover:border-accent/80"
                  }`}
                  aria-label={`Select ${placement.placementName} printable area`}
                  title={`${placement.placementName} printable area`}
                >
                  <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-950/85 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {placement.placementName}
                  </span>
                  {isActive && (
                    <span className="pointer-events-none absolute inset-x-1/2 top-1/2 w-max -translate-x-1/2 -translate-y-1/2 rounded bg-accent/90 px-2 py-1 text-[10px] font-bold text-gray-950 shadow-sm">
                      Printable area
                    </span>
                  )}
                </button>
                {onArtworkUpload && (
                  <button
                    type="button"
                    disabled={!placementUploadState.canUpload}
                    onClick={(event) => {
                      event.stopPropagation();
                      openArtworkPicker(placement.id);
                    }}
                    className="absolute bottom-1 left-1/2 z-20 inline-flex max-w-[calc(100%-0.5rem)] -translate-x-1/2 items-center justify-center gap-1 rounded bg-gray-950/90 px-1.5 py-1 text-[8px] font-bold text-white shadow-sm transition-colors hover:bg-accent hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`${placementUploadState.label} for ${placement.placementName}`}
                  >
                    {isDirectUploading && uploadPlacementId === placement.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    <span className="truncate">{placementUploadState.label}</span>
                  </button>
                )}
              </div>
            );
          })}

          {previewVisibility.showAlignmentGrid && activePlacementRegion && (
            <div
              className="pointer-events-none absolute z-[15] overflow-hidden rounded-md border"
              style={{
                left: `${activePlacementRegion.left}%`,
                top: `${activePlacementRegion.top}%`,
                width: `${activePlacementRegion.width}%`,
                height: `${activePlacementRegion.height}%`,
                borderColor: gridContrast.axisColor,
                backgroundColor: gridContrast.washColor,
                backgroundImage: `linear-gradient(to right, ${gridContrast.lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridContrast.lineColor} 1px, transparent 1px)`,
                backgroundSize: "25% 25%",
              }}
            >
              <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2" style={{ backgroundColor: gridContrast.axisColor }} />
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2" style={{ backgroundColor: gridContrast.axisColor }} />
              <span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border p-1"
                style={{ borderColor: gridContrast.axisColor, backgroundColor: gridContrast.markerColor }}
              />
            </div>
          )}

          {placements.map((placement) => {
            const region = getPlacementRegion(placement.placementName);
            const selection = getSelection(placement.id);
            if (!selection?.uploadedFilePath) return null;

            const isActive = activePlacementId === placement.id;
            const scale = selection.previewScale ?? 1;
            const previewX = selection.previewX ?? 0;
            const previewY = selection.previewY ?? 0;
            const rotation = selection.previewRotation ?? 0;
            const limits = getPreviewOffsetLimits(region.width, region.height, scale, rotation);
            const safePreviewX = clampPreviewPosition(previewX, limits.x);
            const safePreviewY = clampPreviewPosition(previewY, limits.y);

            return (
              <div
                key={`artwork-${placement.id}`}
                className={`absolute z-20 flex items-center justify-center overflow-hidden rounded-sm border-2 bg-[linear-gradient(45deg,#d1d5db_25%,transparent_25%),linear-gradient(-45deg,#d1d5db_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#d1d5db_75%),linear-gradient(-45deg,transparent_75%,#d1d5db_75%)] bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0px] shadow-lg transition-[border,box-shadow] ${
                  previewVisibility.showGuides
                    ? isActive ? "border-accent shadow-[0_0_0_3px_rgba(255,212,0,0.3)]" : "border-emerald-500/80"
                    : "border-transparent bg-transparent shadow-none"
                } ${isDragging && isActive && previewVisibility.allowArtworkEditing ? "cursor-grabbing" : previewVisibility.allowArtworkEditing ? "cursor-grab" : "cursor-default"}`}
                style={{
                  left: `${region.left + region.width / 2 + safePreviewX}%`,
                  top: `${region.top + region.height / 2 + safePreviewY}%`,
                  width: `${region.width * scale}%`,
                  height: `${region.height * scale}%`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  touchAction: "none",
                  backgroundImage: isMockupPreview ? "none" : undefined,
                }}
                onPointerDown={previewVisibility.allowArtworkEditing ? (event) => handlePointerDown(event, placement.id) : undefined}
                onPointerMove={previewVisibility.allowArtworkEditing ? handlePointerMove : undefined}
                onPointerUp={previewVisibility.allowArtworkEditing ? finishDrag : undefined}
                onPointerCancel={previewVisibility.allowArtworkEditing ? finishDrag : undefined}
                role={previewVisibility.allowArtworkEditing ? "button" : undefined}
                tabIndex={previewVisibility.allowArtworkEditing ? 0 : -1}
                aria-label={previewVisibility.allowArtworkEditing ? `Drag ${placement.placementName} artwork to reposition` : `${placement.placementName} artwork preview`}
                onKeyDown={previewVisibility.allowArtworkEditing ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActivePlacementId(placement.id);
                  }
                } : undefined}
              >
                <img
                  src={selection.uploadedFilePath}
                  alt={selection.uploadedFileName || `${placement.placementName} artwork`}
                  className="pointer-events-none h-full w-full object-contain p-1"
                  draggable={false}
                />
                {isActive && previewVisibility.showGuides && (
                  <span className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    Drag
                  </span>
                )}
              </div>
            );
          })}

          {printSelections.length === 0 && !isMockupPreview && (
            <div className="absolute inset-x-4 bottom-4 rounded-lg bg-black/70 px-3 py-2 text-center text-xs text-white">
              Select a placement above to begin your design preview.
            </div>
          )}

          {previewVisibility.showGuides && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/70 bg-gray-950/75 px-3 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm">
              Dashed box = printable area · artwork stays inside
            </div>
          )}
          </div>
        </div>

        {!isMockupPreview && <div className="space-y-3">
          {colorOptions.length > 0 && onGarmentColorChange && (
            <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Garment colour</p>
              <ColorSelector
                colors={colorOptions}
                selectedColorId={selectedColorId}
                onColorSelect={onGarmentColorChange}
              />
              <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
                Select from the colours available for this garment. The preview and your order update together.
              </p>
            </div>
          )}
          <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Placements</p>
            <div className="space-y-2">
              {placements.map((placement) => {
                const selection = getSelection(placement.id);
                const isActive = activePlacementId === placement.id;
                return (
                  <button
                    key={placement.id}
                    type="button"
                    onClick={() => setActivePlacementId(placement.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      isActive
                        ? "border-accent bg-accent/15 text-white"
                        : "border-gray-700 bg-gray-900/50 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    <span className="truncate">{placement.placementName}</span>
                    {selection?.uploadedFilePath ? (
                      <CheckCircle2 className="ml-2 h-4 w-4 flex-shrink-0 text-emerald-400" />
                    ) : (
                      <ImageIcon className="ml-2 h-4 w-4 flex-shrink-0 text-gray-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {activePlacementId !== null && getSelection(activePlacementId)?.uploadedFilePath && (
            <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Adjust artwork</p>
              <p className="mt-1 truncate text-sm font-semibold text-white">
                {placements.find((placement) => placement.id === activePlacementId)?.placementName}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={showAlignmentGrid}
                  onClick={() => setShowAlignmentGrid((visible) => !visible)}
                className={`mt-3 flex min-h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                  showAlignmentGrid
                    ? "border-accent/60 bg-accent/10 text-white"
                    : "border-gray-700 bg-gray-900/50 text-gray-300 hover:border-gray-500"
                }`}
              >
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <Grid3X3 className="h-4 w-4 text-accent" />
                  Alignment grid
                </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {showAlignmentGrid ? "On" : "Off"}
                  </span>
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={snapToGrid}
                  onClick={() => {
                    setSnapToGrid((enabled) => {
                      const nextEnabled = !enabled;
                      if (nextEnabled) setShowAlignmentGrid(true);
                      return nextEnabled;
                    });
                  }}
                  className={`flex min-h-10 items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                    snapToGrid
                      ? "border-accent/60 bg-accent/10 text-white"
                      : "border-gray-700 bg-gray-900/50 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <Grid3X3 className="h-4 w-4 text-accent" />
                    Snap to grid
                  </span>
                  <span className="sr-only">Enabling this also shows the alignment grid</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {snapToGrid ? "On" : "Off"}
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => onPositionChange(activePlacementId, 0, 0)}
                className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-accent/60 hover:bg-accent/10 hover:text-white active:scale-[0.99]"
              >
                <Crosshair className="h-4 w-4 text-accent" />
                Center in area
              </button>
              <div className="mt-3 border-t border-gray-700 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-300">Position</span>
                  <span className="text-[10px] font-semibold text-gray-400">
                    X {Math.round(getSelection(activePlacementId)?.previewX ?? 0)} · Y {Math.round(getSelection(activePlacementId)?.previewY ?? 0)}
                  </span>
                </div>
                <div className="mx-auto mt-2 grid w-32 grid-cols-3 gap-1.5">
                  <span aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => nudgeArtworkPosition(activePlacementId, 0, -1)}
                    className="min-h-10 rounded-md bg-gray-700 px-2 text-sm font-bold text-gray-100 hover:bg-gray-600 active:scale-95"
                    aria-label="Move artwork up within this placement"
                  >
                    ↑
                  </button>
                  <span aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => nudgeArtworkPosition(activePlacementId, -1, 0)}
                    className="min-h-10 rounded-md bg-gray-700 px-2 text-sm font-bold text-gray-100 hover:bg-gray-600 active:scale-95"
                    aria-label="Move artwork left within this placement"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => onPositionChange(activePlacementId, 0, 0)}
                    className="min-h-10 rounded-md border border-accent/60 bg-accent/10 px-2 text-[10px] font-bold text-accent hover:bg-accent hover:text-gray-950 active:scale-95"
                    aria-label="Center artwork within this placement"
                  >
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeArtworkPosition(activePlacementId, 1, 0)}
                    className="min-h-10 rounded-md bg-gray-700 px-2 text-sm font-bold text-gray-100 hover:bg-gray-600 active:scale-95"
                    aria-label="Move artwork right within this placement"
                  >
                    →
                  </button>
                  <span aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => nudgeArtworkPosition(activePlacementId, 0, 1)}
                    className="min-h-10 rounded-md bg-gray-700 px-2 text-sm font-bold text-gray-100 hover:bg-gray-600 active:scale-95"
                    aria-label="Move artwork down within this placement"
                  >
                    ↓
                  </button>
                  <span aria-hidden="true" />
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-gray-400">Use arrows for precise 1% nudges inside the active printable area.</p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-gray-300">Size</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const selection = getSelection(activePlacementId);
                      onScaleChange(activePlacementId, clampPreviewScale((selection?.previewScale ?? 1) - 0.1));
                    }}
                    className="rounded-md bg-gray-700 p-2 text-gray-200 hover:bg-gray-600 active:scale-95"
                    aria-label="Make artwork smaller"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-xs font-semibold text-white">
                    {Math.round((getSelection(activePlacementId)?.previewScale ?? 1) * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const selection = getSelection(activePlacementId);
                      onScaleChange(activePlacementId, clampPreviewScale((selection?.previewScale ?? 1) + 0.1));
                    }}
                    className="rounded-md bg-gray-700 p-2 text-gray-200 hover:bg-gray-600 active:scale-95"
                    aria-label="Make artwork larger"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-gray-400">
                Grid contrast: {gridContrast.mode === "light" ? "dark lines" : "light lines"} for this garment colour.
              </p>
              <div className="mt-4 rounded-lg border border-accent/30 bg-accent/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">Estimated print size</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {displayedArtworkDimensions.width} {dimensionUnit} × {displayedArtworkDimensions.height} {dimensionUnit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-gray-950/40 p-1" role="group" aria-label="Artwork dimension units">
                    {(["cm", "in"] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setDimensionUnit(unit)}
                        className={`min-h-7 rounded-full px-2.5 text-[10px] font-bold uppercase transition-colors ${
                          dimensionUnit === unit ? "bg-accent text-gray-950" : "text-gray-300 hover:bg-gray-700"
                        }`}
                        aria-pressed={dimensionUnit === unit}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-gray-300">
                  Updates as you resize. This is an estimate based on the selected print size and current scale.
                </p>
              </div>
              <div className="mt-4 border-t border-gray-700 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-300">Rotate</span>
                  <span className="text-xs font-semibold text-white">
                    {Math.round(getSelection(activePlacementId)?.previewRotation ?? 0)}°
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const selection = getSelection(activePlacementId);
                      onRotationChange(
                        activePlacementId,
                        normalizePreviewRotation((selection?.previewRotation ?? 0) - 15)
                      );
                    }}
                    className="inline-flex min-h-10 items-center justify-center gap-1 rounded-md bg-gray-700 px-2 text-xs font-semibold text-gray-100 hover:bg-gray-600 active:scale-95"
                    aria-label="Rotate artwork left 15 degrees"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => onRotationChange(activePlacementId, 0)}
                    className="min-h-10 rounded-md border border-gray-600 px-2 text-xs font-semibold text-gray-300 hover:bg-gray-700 active:scale-95"
                    aria-label="Reset artwork rotation"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const selection = getSelection(activePlacementId);
                      onRotationChange(
                        activePlacementId,
                        normalizePreviewRotation((selection?.previewRotation ?? 0) + 15)
                      );
                    }}
                    className="inline-flex min-h-10 items-center justify-center gap-1 rounded-md bg-gray-700 px-2 text-xs font-semibold text-gray-100 hover:bg-gray-600 active:scale-95"
                    aria-label="Rotate artwork right 15 degrees"
                  >
                    Right
                    <RotateCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
                Drag the artwork within the highlighted placement. Position, size, and rotation are saved with this order request.
              </p>
            </div>
          )}
        </div>}
      </div>
    </div>
  );
}
