import { useState, useEffect } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Placement {
  id: number;
  placementName: string;
  positionCoordinates?: any;
}

interface PrintSelection {
  placementId: number;
  printSizeId: number;
  uploadedFilePath?: string;
  uploadedFileName?: string;
}

interface GarmentPlacementPreviewProps {
  selectedPlacements: number[];
  allPlacements: Placement[];
  printSelections?: PrintSelection[];
}

export function GarmentPlacementPreview({
  selectedPlacements,
  allPlacements,
  printSelections = [],
}: GarmentPlacementPreviewProps) {
  const [loadingPlacements, setLoadingPlacements] = useState<Set<number>>(
    new Set()
  );
  const [successPlacements, setSuccessPlacements] = useState<Set<number>>(
    new Set()
  );

  const placementColors: Record<string, string> = {
    Front: "#3b82f6", // blue
    Back: "#8b5cf6", // purple
    "Left Sleeve": "#ec4899", // pink
    "Right Sleeve": "#f97316", // orange
    Pocket: "#06b6d4", // cyan
    Collar: "#10b981", // emerald
  };

  // Track when designs are being loaded
  useEffect(() => {
    const newLoading = new Set<number>();
    selectedPlacements.forEach((placementId) => {
      const selection = printSelections.find(
        (s) => s.placementId === placementId
      );
      if (selection?.uploadedFilePath && !successPlacements.has(placementId)) {
        newLoading.add(placementId);
      }
    });
    setLoadingPlacements(newLoading);
  }, [printSelections, selectedPlacements, successPlacements]);

  // Simulate design processing and show success
  useEffect(() => {
    if (loadingPlacements.size === 0) return;

    const timers = Array.from(loadingPlacements).map((placementId) => {
      return setTimeout(() => {
        setLoadingPlacements((prev) => {
          const next = new Set(prev);
          next.delete(placementId);
          return next;
        });
        setSuccessPlacements((prev) => new Set(prev).add(placementId));
      }, 800);
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [loadingPlacements]);

  const getPlacementPath = (placementName: string): string => {
    switch (placementName) {
      case "Front":
        return "M 50 25 Q 45 30 45 40 L 45 70 Q 50 75 50 75 Q 50 75 55 70 L 55 40 Q 55 30 50 25 Z";
      case "Back":
        return "M 50 25 Q 45 30 45 40 L 45 70 Q 50 75 50 75 Q 50 75 55 70 L 55 40 Q 55 30 50 25 Z";
      case "Left Sleeve":
        return "M 35 35 Q 30 35 28 40 L 25 50 Q 25 55 28 60 Q 30 65 35 65 L 45 60 L 45 40 Z";
      case "Right Sleeve":
        return "M 65 35 Q 70 35 72 40 L 75 50 Q 75 55 72 60 Q 70 65 65 65 L 55 60 L 55 40 Z";
      case "Pocket":
        return "M 48 50 Q 48 48 50 48 Q 52 48 52 50 L 52 60 Q 52 62 50 62 Q 48 62 48 60 Z";
      case "Collar":
        return "M 45 20 Q 50 18 55 20 L 52 28 Q 50 27 48 28 Z";
      default:
        return "";
    }
  };

  return (
    <div className="bg-gray-700/50 rounded-lg p-4 md:p-6">
      <h3 className="text-white font-semibold text-sm md:text-base mb-4">
        Print Placement Preview
      </h3>

      {/* Garment Silhouette with Design Overlay */}
      <div className="flex justify-center mb-4 relative">
        {/* Loading/Success Indicators */}
        <div className="absolute top-0 right-0 space-y-2 z-10">
          {selectedPlacements.map((placementId) => {
            const placement = allPlacements.find((p) => p.id === placementId);
            const isLoading = loadingPlacements.has(placementId);
            const isSuccess = successPlacements.has(placementId);

            if (!isLoading && !isSuccess) return null;

            return (
              <div
                key={placementId}
                className="flex items-center gap-2 bg-gray-900/90 px-3 py-2 rounded-lg text-xs text-white border border-gray-600"
              >
                {isLoading && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span>Processing...</span>
                  </>
                )}
                {isSuccess && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-green-400">Ready</span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="relative w-32 h-40 md:w-40 md:h-48">
          {/* SVG Garment */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full absolute inset-0"
            style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))" }}
          >
            {/* Garment body outline */}
            <g stroke="#9ca3af" strokeWidth="0.5" fill="none">
              {/* Neck */}
              <circle cx="50" cy="20" r="4" />
              {/* Body */}
              <path d="M 45 24 Q 40 28 40 40 L 40 75 Q 45 80 50 80 Q 55 80 60 75 L 60 40 Q 60 28 55 24 Z" />
              {/* Left sleeve */}
              <path d="M 40 30 Q 30 30 28 35 L 25 50 Q 25 55 28 60 Q 30 65 40 65" />
              {/* Right sleeve */}
              <path d="M 60 30 Q 70 30 72 35 L 75 50 Q 75 55 72 60 Q 70 65 60 65" />
            </g>

            {/* Placement highlights with clipping masks */}
            <defs>
              {selectedPlacements.map((placementId) => {
                const placement = allPlacements.find((p) => p.id === placementId);
                if (!placement) return null;
                const path = getPlacementPath(placement.placementName);
                return (
                  <clipPath key={`clip-${placementId}`} id={`clip-${placementId}`}>
                    <path d={path} />
                  </clipPath>
                );
              })}
            </defs>

            {/* Design overlays */}
            {selectedPlacements.map((placementId) => {
              const placement = allPlacements.find((p) => p.id === placementId);
              const selection = printSelections.find(
                (s) => s.placementId === placementId
              );
              if (!placement || !selection?.uploadedFilePath) return null;

              const color =
                placementColors[placement.placementName] || "#fbbf24";
              const path = getPlacementPath(placement.placementName);

              return (
                <g key={placementId}>
                  {/* Design image with clipping */}
                  <image
                    href={selection.uploadedFilePath}
                    x="0"
                    y="0"
                    width="100"
                    height="100"
                    clipPath={`url(#clip-${placementId})`}
                    opacity="0.85"
                    style={{
                      filter: "drop-shadow(0 0 4px rgba(0, 0, 0, 0.5))",
                    }}
                  />
                  {/* Animated border */}
                  <path
                    d={path}
                    stroke={color}
                    strokeWidth="1"
                    fill="none"
                    style={{
                      animation:
                        "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
                  />
                </g>
              );
            })}

            {/* Fallback color highlights if no design uploaded */}
            {selectedPlacements.map((placementId) => {
              const placement = allPlacements.find((p) => p.id === placementId);
              const selection = printSelections.find(
                (s) => s.placementId === placementId
              );
              if (!placement || selection?.uploadedFilePath) return null;

              const color =
                placementColors[placement.placementName] || "#fbbf24";
              const path = getPlacementPath(placement.placementName);

              return (
                <g key={placementId}>
                  {/* Color highlight */}
                  <path
                    d={path}
                    fill={color}
                    opacity="0.7"
                    style={{
                      filter: "drop-shadow(0 0 4px rgba(0, 0, 0, 0.5))",
                    }}
                  />
                  {/* Animated border */}
                  <path
                    d={path}
                    stroke={color}
                    strokeWidth="1"
                    fill="none"
                    style={{
                      animation:
                        "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      {selectedPlacements.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-300 mb-2">Selected placements:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedPlacements.map((placementId) => {
              const placement = allPlacements.find((p) => p.id === placementId);
              if (!placement) return null;

              const color =
                placementColors[placement.placementName] || "#fbbf24";

              return (
                <div
                  key={placementId}
                  className="flex items-center gap-2 text-xs text-gray-200"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>{placement.placementName}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedPlacements.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">
            Select a placement to see preview
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            stroke-width: 1;
            opacity: 1;
          }
          50% {
            stroke-width: 1.5;
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
