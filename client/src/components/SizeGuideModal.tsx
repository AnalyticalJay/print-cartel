import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  productType?: "T-Shirt" | "Polo" | "Hoodie";
}

const sizeData = {
  "T-Shirt": [
    { size: "XS", chest: "33-35", length: "27", sleeve: "7.5" },
    { size: "S", chest: "35-37", length: "28", sleeve: "8" },
    { size: "M", chest: "37-40", length: "29", sleeve: "8.5" },
    { size: "L", chest: "40-43", length: "30", sleeve: "9" },
    { size: "XL", chest: "43-46", length: "31", sleeve: "9.5" },
    { size: "2XL", chest: "46-49", length: "32", sleeve: "10" },
    { size: "3XL", chest: "49-52", length: "33", sleeve: "10.5" },
    { size: "4XL", chest: "52-55", length: "34", sleeve: "11" },
    { size: "5XL", chest: "55-58", length: "35", sleeve: "11.5" },
    { size: "6XL", chest: "58-61", length: "36", sleeve: "12" },
  ],
  "Polo": [
    { size: "S", chest: "35-37", length: "28", sleeve: "8" },
    { size: "M", chest: "37-40", length: "29", sleeve: "8.5" },
    { size: "L", chest: "40-43", length: "30", sleeve: "9" },
    { size: "XL", chest: "43-46", length: "31", sleeve: "9.5" },
    { size: "2XL", chest: "46-49", length: "32", sleeve: "10" },
    { size: "3XL", chest: "49-52", length: "33", sleeve: "10.5" },
    { size: "5XL", chest: "55-58", length: "35", sleeve: "11.5" },
  ],
  "Hoodie": [
    { size: "XS", chest: "33-35", length: "27", sleeve: "7.5" },
    { size: "S", chest: "35-37", length: "28", sleeve: "8" },
    { size: "M", chest: "37-40", length: "29", sleeve: "8.5" },
    { size: "L", chest: "40-43", length: "30", sleeve: "9" },
    { size: "XL", chest: "43-46", length: "31", sleeve: "9.5" },
    { size: "2XL", chest: "46-49", length: "32", sleeve: "10" },
    { size: "3XL", chest: "49-52", length: "33", sleeve: "10.5" },
  ],
};

export function SizeGuideModal({ isOpen, onClose, productType = "T-Shirt" }: SizeGuideModalProps) {
  const [unit, setUnit] = useState<"inches" | "cm">("inches");

  const convertMeasurement = (inches: string): string => {
    if (unit === "inches") return inches;
    // Convert inches to cm (1 inch = 2.54 cm)
    const inchValue = parseFloat(inches);
    if (isNaN(inchValue)) return inches;
    return (inchValue * 2.54).toFixed(1);
  };

  const convertRange = (range: string): string => {
    if (unit === "inches") return range;
    const [min, max] = range.split("-").map(v => parseFloat(v));
    if (isNaN(min) || isNaN(max)) return range;
    return `${(min * 2.54).toFixed(1)}-${(max * 2.54).toFixed(1)}`;
  };

  const currentSizes = sizeData[productType] || sizeData["T-Shirt"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Size Guide - {productType}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Unit Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Measurement Units:</span>
            <div className="flex gap-2">
              <Button
                variant={unit === "inches" ? "default" : "outline"}
                size="sm"
                onClick={() => setUnit("inches")}
              >
                Inches
              </Button>
              <Button
                variant={unit === "cm" ? "default" : "outline"}
                size="sm"
                onClick={() => setUnit("cm")}
              >
                Centimeters
              </Button>
            </div>
          </div>

          {/* Size Chart Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Size</th>
                  <th className="px-4 py-2 text-left font-semibold">Chest ({unit === "inches" ? "in" : "cm"})</th>
                  <th className="px-4 py-2 text-left font-semibold">Length ({unit === "inches" ? "in" : "cm"})</th>
                  <th className="px-4 py-2 text-left font-semibold">Sleeve ({unit === "inches" ? "in" : "cm"})</th>
                </tr>
              </thead>
              <tbody>
                {currentSizes && currentSizes.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <td className="px-4 py-3 font-semibold text-accent">{row.size}</td>
                    <td className="px-4 py-3">{convertRange(row.chest)}</td>
                    <td className="px-4 py-3">{convertMeasurement(row.length)}</td>
                    <td className="px-4 py-3">{convertMeasurement(row.sleeve)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Measurement Guide */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">How to Measure:</h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li><strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape parallel to the ground.</li>
              <li><strong>Length:</strong> Measure from the top of the shoulder to the bottom hem of the garment.</li>
              <li><strong>Sleeve:</strong> Measure from the center back neck, across the shoulder, and down to the wrist.</li>
            </ul>
          </div>

          {/* Fit Note */}
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Fit Note:</strong> All measurements are approximate and may vary slightly by garment. For the best fit, we recommend measuring a garment that fits you well and comparing it to these measurements.
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
