"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, X } from "lucide-react";

interface PrintSelection {
  placementId: number;
  printSizeId: number;
}

interface Placement {
  id: number;
  placementName: string;
  positionCoordinates?: any;
}

interface PrintOption {
  id: number;
  printSize: string;
  additionalPrice: string | number;
}

interface PrintPlacementSelectorProps {
  placements: Placement[];
  printOptions: PrintOption[];
  printSelections: PrintSelection[];
  onAddSelection: (placementId: number, printSizeId: number) => void;
  onRemoveSelection: (index: number) => void;
}

const placementDescriptions: Record<string, string> = {
  "Front": "Center chest area, ideal for logos and main designs",
  "Back": "Full back area, perfect for large designs and artwork",
  "Left Sleeve": "Left arm placement, great for small logos",
  "Right Sleeve": "Right arm placement, great for small logos",
  "Pocket": "Chest pocket area, perfect for small branding",
  "Collar": "Neck area, ideal for small logos or text",
};

export function PrintPlacementSelector({
  placements,
  printOptions,
  printSelections,
  onAddSelection,
  onRemoveSelection,
}: PrintPlacementSelectorProps) {
  const [expandedPlacement, setExpandedPlacement] = useState<number | null>(null);

  return (
    <div className="space-y-2 md:space-y-4">
      {/* Placement Selection */}
      <div className="space-y-2">
        {placements.map((placement) => {
          const isExpanded = expandedPlacement === placement.id;
          const selectedForPlacement = printSelections.filter(
            (p) => p.placementId === placement.id
          );

          return (
            <div
              key={placement.id}
              className="border border-gray-600 rounded-lg overflow-hidden bg-gray-700"
            >
              {/* Placement Header */}
              <button
                onClick={() =>
                  setExpandedPlacement(isExpanded ? null : placement.id)
                }
                className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-gray-600 transition-colors active:bg-gray-600"
              >
                <div className="flex items-center gap-2 md:gap-3 flex-1 text-left min-w-0">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-semibold text-sm md:text-base">
                      {placement.placementName}
                    </h3>
                    <p className="text-gray-300 text-xs md:text-sm line-clamp-1">
                      {placementDescriptions[placement.placementName] ||
                        "Select print size for this placement"}
                    </p>
                  </div>
                  {selectedForPlacement.length > 0 && (
                    <span className="bg-accent text-black text-xs font-bold px-2 md:px-3 py-1 rounded whitespace-nowrap">
                      {selectedForPlacement.length}
                    </span>
                  )}
                </div>
                <ChevronDown
                  size={20}
                  className={`text-gray-200 transition-transform ml-2 flex-shrink-0 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Print Size Options */}
              {isExpanded && (
                <div className="border-t border-gray-600 p-3 md:p-4 bg-gray-600/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                    {printOptions.map((option) => {
                      const isSelected = printSelections.some(
                        (p) =>
                          p.placementId === placement.id &&
                          p.printSizeId === option.id
                      );

                      const priceNum =
                        typeof option.additionalPrice === "string"
                          ? parseFloat(option.additionalPrice)
                          : option.additionalPrice;

                      return (
                        <button
                          key={option.id}
                          onClick={() =>
                            onAddSelection(placement.id, option.id)
                          }
                          className={`p-3 md:p-3 rounded-lg border-2 transition-all text-xs md:text-sm font-semibold active:scale-95 ${
                            isSelected
                              ? "border-accent bg-accent text-black"
                              : "border-gray-500 bg-gray-500 text-white hover:border-gray-400 hover:bg-gray-400"
                          }`}
                        >
                          <div className="font-bold">{option.printSize}</div>
                          <div className="text-xs font-normal opacity-90">
                            +R{priceNum.toFixed(2)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Summary */}
      {printSelections.length > 0 && (
        <Card className="bg-gray-700 border-accent/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">
              Selected Placements ({printSelections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {printSelections.map((selection, index) => {
                const placement = placements.find(
                  (p) => p.id === selection.placementId
                );
                const option = printOptions.find(
                  (o) => o.id === selection.printSizeId
                );

                const priceNum =
                  typeof option?.additionalPrice === "string"
                    ? parseFloat(option.additionalPrice)
                    : option?.additionalPrice || 0;

                return (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-gray-600/50 rounded"
                  >
                    <div className="text-sm text-gray-200">
                      <span className="font-semibold text-white">
                        {placement?.placementName}
                      </span>
                      {" - "}
                      <span>{option?.printSize}</span>
                      <span className="text-accent ml-2">
                        +R{priceNum.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveSelection(index)}
                      className="text-red-400 hover:text-red-300 ml-2 p-1"
                      title="Remove selection"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
