import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SizeChartDisplayProps {
  productName?: string;
}

export const SizeChartDisplay: React.FC<SizeChartDisplayProps> = ({
  productName = 'Garment',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sizeData = [
    { size: 'XS', chest: 32, length: 66, sleeve: 58 },
    { size: 'S', chest: 36, length: 68, sleeve: 60 },
    { size: 'M', chest: 40, length: 70, sleeve: 62 },
    { size: 'L', chest: 44, length: 72, sleeve: 64 },
    { size: 'XL', chest: 48, length: 74, sleeve: 66 },
    { size: '2XL', chest: 52, length: 76, sleeve: 68 },
    { size: '3XL', chest: 56, length: 78, sleeve: 70 },
    { size: '4XL', chest: 60, length: 80, sleeve: 72 },
    { size: '5XL', chest: 64, length: 82, sleeve: 74 },
  ];

  return (
    <div className="w-full space-y-4">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="outline"
        className="w-full justify-between text-foreground border-border hover:bg-accent/10"
      >
        <span className="font-semibold">Size Chart & Fit Guide</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </Button>

      {isExpanded && (
        <div className="space-y-6 p-4 bg-card border border-border rounded-lg">
          {/* Size Chart Table */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Size Measurements (cm)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Size</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">
                      Chest Width (cm)
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">
                      Length (cm)
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">
                      Sleeve Length (cm)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sizeData.map((row, idx) => (
                    <tr
                      key={row.size}
                      className={`border-b border-border ${
                        idx % 2 === 0 ? 'bg-background' : 'bg-muted/50'
                      }`}
                    >
                      <td className="px-3 py-2 font-semibold text-foreground">{row.size}</td>
                      <td className="px-3 py-2 text-foreground">{row.chest}</td>
                      <td className="px-3 py-2 text-foreground">{row.length}</td>
                      <td className="px-3 py-2 text-foreground">{row.sleeve}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All measurements are in centimetres (cm)
            </p>
          </div>

          {/* Fit Guide Image */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">How to Measure for Best Fit</h3>
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663346956907/kDHKMkQxvxGGSdVdvmorSF/fit-guide-88xa8s5Rf4xjdihVyHSHUv.webp"
              alt="Garment Fit Guide - How to Measure"
              className="w-full rounded-lg border border-border"
            />
            <p className="text-xs text-muted-foreground mt-2">
              For best fit, measure a garment that fits you well and compare with our size chart.
            </p>
          </div>

          {/* Tips */}
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
            <h4 className="font-semibold text-foreground text-sm mb-2">Sizing Tips:</h4>
            <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
              <li>Measure a garment that fits you well for accurate comparison</li>
              <li>All measurements are taken flat and doubled where applicable</li>
              <li>Chest width is measured across the widest part of the garment</li>
              <li>Length is measured from the highest shoulder point to the hem</li>
              <li>Sleeve length is measured from the shoulder seam to the wrist</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
