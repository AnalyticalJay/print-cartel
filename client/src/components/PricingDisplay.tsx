import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PricingBreakdownData {
  basePrice: number;
  productSubtotal: number;
  placementCost: number;
  printSizeCosts: number;
  totalPrice: number;
  details: {
    productName: string;
    quantity: number;
    numPlacements: number;
    printSizeDetails: Array<{
      printSize: string;
      additionalPrice: number;
    }>;
  };
}

interface PricingDisplayProps {
  pricing: PricingBreakdownData | null;
  isLoading?: boolean;
}

export function PricingDisplay({ pricing, isLoading }: PricingDisplayProps) {
  if (isLoading) {
    return (
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white">Price Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Calculating price...</p>
        </CardContent>
      </Card>
    );
  }

  if (!pricing) {
    return (
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white">Price Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Select options to see pricing</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-700 border-gray-600">
      <CardHeader>
        <CardTitle className="text-white">Price Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>Product ({pricing.details.productName} × {pricing.details.quantity}):</span>
            <span>R{pricing.productSubtotal.toFixed(2)}</span>
          </div>

          {pricing.details.numPlacements > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>Print Placements ({pricing.details.numPlacements} × R50):</span>
              <span>R{pricing.placementCost.toFixed(2)}</span>
            </div>
          )}

          {pricing.printSizeCosts > 0 && (
            <>
              <div className="flex justify-between text-gray-300">
                <span>Print Sizes:</span>
                <span>R{pricing.printSizeCosts.toFixed(2)}</span>
              </div>

              {pricing.details.printSizeDetails.length > 0 && (
                <div className="ml-4 space-y-1 text-gray-400 text-xs">
                  {pricing.details.printSizeDetails.map((detail, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{detail.printSize}:</span>
                      <span>R{detail.additionalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-600 pt-3">
          <div className="flex justify-between font-bold text-white text-lg">
            <span>Total Estimated Price:</span>
            <span className="text-green-400">R{pricing.totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Final pricing may vary based on design complexity and special requirements. You will receive a detailed quote after submission.
        </p>
      </CardContent>
    </Card>
  );
}
