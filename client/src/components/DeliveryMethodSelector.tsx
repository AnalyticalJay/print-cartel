import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Truck } from "lucide-react";

interface DeliveryMethodSelectorProps {
  selectedMethod: "collection" | "delivery" | null;
  onSelect: (method: "collection" | "delivery") => void;
}

const COLLECTION_ADDRESS = "308 Cape Road, Newton Park, Gqeberha, 6045";
const DELIVERY_CHARGE = 150;
const DELIVERY_TIMEFRAME = "2-4 business days";

export function DeliveryMethodSelector({ selectedMethod, onSelect }: DeliveryMethodSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-foreground mb-2">Delivery Method</h3>
        <p className="text-gray-600">Choose how you'd like to receive your order</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Collection Option */}
        <Card
          className={`p-6 cursor-pointer transition-all border-2 ${
            selectedMethod === "collection"
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/50"
          }`}
          onClick={() => onSelect("collection")}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <MapPin className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-foreground mb-2">Collection</h4>
              <p className="text-sm text-gray-600 mb-4">
                Pick up your order from our Port Elizabeth location
              </p>

              {/* Address Box */}
              <div className="bg-white border-2 border-dashed border-accent/30 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold text-accent mb-1">COLLECTION ADDRESS</p>
                <p className="text-sm font-medium text-foreground">{COLLECTION_ADDRESS}</p>
              </div>

              {/* Port Elizabeth Only Badge */}
              <div className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                ⚠️ Port Elizabeth Only
              </div>

              {/* Selection Indicator */}
              {selectedMethod === "collection" && (
                <div className="mt-4 pt-4 border-t border-accent/20">
                  <p className="text-sm font-semibold text-accent">✓ Selected</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Delivery Option */}
        <Card
          className={`p-6 cursor-pointer transition-all border-2 ${
            selectedMethod === "delivery"
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/50"
          }`}
          onClick={() => onSelect("delivery")}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Truck className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-foreground mb-2">Nationwide Delivery</h4>
              <p className="text-sm text-gray-600 mb-4">
                We'll deliver your order to any address in South Africa
              </p>

              {/* Delivery Details */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Timeframe:</span>
                  <span className="text-sm font-semibold text-foreground">{DELIVERY_TIMEFRAME}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Delivery Charge:</span>
                  <span className="text-sm font-bold text-accent">R{DELIVERY_CHARGE.toFixed(2)}</span>
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedMethod === "delivery" && (
                <div className="pt-4 border-t border-accent/20">
                  <p className="text-sm font-semibold text-accent">✓ Selected</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Collection is only available in Port Elizabeth. If you're outside Port Elizabeth, please select Nationwide Delivery.
        </p>
      </div>

      {/* Selection Status */}
      {!selectedMethod && (
        <div className="text-center py-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm font-semibold text-yellow-800">Please select a delivery method to continue</p>
        </div>
      )}
    </div>
  );
}
