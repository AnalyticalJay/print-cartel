import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Image as ImageIcon,
  Minus,
  Move,
  Plus,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import {
  clampPreviewPosition,
  clampPreviewScale,
  getPlacementRegion,
  getPreviewOffsetLimits,
  normalizePreviewRotation,
} from "@/lib/mockupGeometry";

interface Placement {
  id: number;
  placementName: string;
}

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
  placements: Placement[];
  printSelections: InteractivePrintSelection[];
  onPositionChange: (placementId: number, x: number, y: number) => void;
  onScaleChange: (placementId: number, scale: number) => void;
  onRotationChange: (placementId: number, rotation: number) => void;
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
  productImageUrl,
  garmentColor = "#d1d5db",
  placements,
  printSelections,
  onPositionChange,
  onScaleChange,
  onRotationChange,
}: InteractiveGarmentMockupProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [activePlacementId, setActivePlacementId] = useState<number | null>(
    printSelections[0]?.placementId ?? placements[0]?.id ?? null
  );
  const [isDragging, setIsDragging] = useState(false);

  const selectionByPlacement = useMemo(
    () => new Map(printSelections.map((selection) => [selection.placementId, selection])),
    [printSelections]
  );

  const getSelection = (placementId: number) => selectionByPlacement.get(placementId);

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

    onPositionChange(
      drag.placementId,
      clampPreviewPosition(drag.startX + deltaX, limits.x),
      clampPreviewPosition(drag.startY + deltaY, limits.y)
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
        <div className="flex items-center gap-1.5 text-xs text-accent">
          <Move className="h-4 w-4" />
          <span>Drag to position</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
        <div
          ref={stageRef}
          className={`relative mx-auto aspect-[3/4] w-full max-w-[480px] overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white via-slate-50 to-slate-200 shadow-2xl select-none lg:sticky lg:top-6 ${
            isDragging ? "cursor-grabbing border-accent" : "border-gray-300"
          }`}
          style={{ touchAction: "none" }}
        >
          <div className="pointer-events-none absolute left-3 top-3 z-30 rounded-full border border-white/80 bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 shadow-sm backdrop-blur-sm">
            3D garment view
          </div>

          {productImageUrl ? (
            <img
              src={productImageUrl}
              alt={`${productName} full garment mockup`}
              className="absolute inset-0 h-full w-full object-contain p-3 md:p-5"
              style={{
                filter: "drop-shadow(0 22px 18px rgba(15, 23, 42, 0.2))",
                transform: "perspective(1200px) rotateX(2deg)",
              }}
              draggable={false}
            />
          ) : (
            <svg viewBox="0 0 100 125" className="absolute inset-0 h-full w-full p-3 md:p-5" aria-label="3D garment silhouette">
              <defs>
                <linearGradient id="garmentBodyGradient" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor={garmentColor} />
                  <stop offset="0.52" stopColor="#ffffff" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#64748b" stopOpacity="0.38" />
                </linearGradient>
                <linearGradient id="garmentSleeveGradient" x1="0" x2="1">
                  <stop offset="0" stopColor="#64748b" stopOpacity="0.35" />
                  <stop offset="0.45" stopColor={garmentColor} />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0.35" />
                </linearGradient>
                <filter id="garmentShadow" x="-30%" y="-30%" width="160%" height="170%">
                  <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.25" />
                </filter>
              </defs>
              <path
                d="M33 16 18 24 8 43l15 9 7-11v66h40V41l7 11 15-9-10-19-15-8c-2 7-7 11-15 11s-13-4-15-11Z"
                fill="url(#garmentBodyGradient)"
                stroke="#64748b"
                strokeWidth="0.8"
                filter="url(#garmentShadow)"
              />
              <path d="M8 43 23 52l7-11v66" fill="none" stroke="url(#garmentSleeveGradient)" strokeWidth="2" opacity="0.8" />
              <path d="M92 43 77 52l-7-11v66" fill="none" stroke="#475569" strokeWidth="1.3" opacity="0.55" />
              <path d="M39 17c1 7 5 11 11 11s10-4 11-11" fill="none" stroke="#475569" strokeWidth="1" />
              <path d="M31 41v66M69 41v66" stroke="#64748b" strokeWidth="0.55" opacity="0.45" />
              <path d="M33 101h34" stroke="#475569" strokeWidth="0.8" opacity="0.5" />
            </svg>
          )}

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_18%,rgba(255,255,255,0.62),transparent_32%),linear-gradient(145deg,rgba(255,255,255,0.15),transparent_48%,rgba(15,23,42,0.1))]" />

          {placements.map((placement) => {
            const region = getPlacementRegion(placement.placementName);
            const selection = getSelection(placement.id);
            const isActive = activePlacementId === placement.id;
            const hasArtwork = Boolean(selection?.uploadedFilePath);

            return (
              <button
                key={`region-${placement.id}`}
                type="button"
                onClick={() => setActivePlacementId(placement.id)}
                className={`absolute z-10 rounded-md border-2 border-dashed transition-all ${
                  isActive
                    ? "border-accent bg-accent/10 shadow-[0_0_0_2px_rgba(255,212,0,0.25)]"
                    : hasArtwork
                      ? "border-emerald-400/70 bg-emerald-400/5"
                      : "border-gray-500/70 bg-gray-500/5 hover:border-accent/80"
                }`}
                style={{
                  left: `${region.left}%`,
                  top: `${region.top}%`,
                  width: `${region.width}%`,
                  height: `${region.height}%`,
                }}
                aria-label={`Printable area for ${placement.placementName}`}
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
                {!hasArtwork && isActive && (
                  <span className="pointer-events-none flex h-full items-center justify-center px-1 text-center text-[10px] font-medium text-gray-700">
                    Upload artwork
                  </span>
                )}
              </button>
            );
          })}

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
                  isActive ? "border-accent shadow-[0_0_0_3px_rgba(255,212,0,0.3)]" : "border-emerald-500/80"
                } ${isDragging && isActive ? "cursor-grabbing" : "cursor-grab"}`}
                style={{
                  left: `${region.left + region.width / 2 + safePreviewX}%`,
                  top: `${region.top + region.height / 2 + safePreviewY}%`,
                  width: `${region.width * scale}%`,
                  height: `${region.height * scale}%`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  touchAction: "none",
                }}
                onPointerDown={(event) => handlePointerDown(event, placement.id)}
                onPointerMove={handlePointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                role="button"
                tabIndex={0}
                aria-label={`Drag ${placement.placementName} artwork to reposition`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActivePlacementId(placement.id);
                  }
                }}
              >
                <img
                  src={selection.uploadedFilePath}
                  alt={selection.uploadedFileName || `${placement.placementName} artwork`}
                  className="pointer-events-none h-full w-full object-contain p-1"
                  draggable={false}
                />
                {isActive && (
                  <span className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    Drag
                  </span>
                )}
              </div>
            );
          })}

          {printSelections.length === 0 && (
            <div className="absolute inset-x-4 bottom-4 rounded-lg bg-black/70 px-3 py-2 text-center text-xs text-white">
              Select a placement above to begin your design preview.
            </div>
          )}

          <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/70 bg-gray-950/75 px-3 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm">
            Dashed box = printable area · artwork stays inside
          </div>
        </div>

        <div className="space-y-3">
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
        </div>
      </div>
    </div>
  );
}
