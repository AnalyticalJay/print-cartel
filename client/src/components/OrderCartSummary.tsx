import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrderCart, CartLineItem } from "@/hooks/useOrderCart";
import { Trash2, Edit2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OrderCartSummaryProps {
  onEditItem?: (item: CartLineItem) => void;
}

export function OrderCartSummary({ onEditItem }: OrderCartSummaryProps) {
  const { items, removeItem, getTotal, getItemCount } = useOrderCart();

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Your cart is empty. Add garments to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Order Summary ({getItemCount()} items)</span>
          <span className="text-lg font-bold text-cyan-600">{formatCurrency(getTotal())}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between rounded-lg border p-4">
            <div className="flex-1">
              <h4 className="font-semibold">{item.productName}</h4>
              <p className="text-sm text-muted-foreground">
                {item.colorName} • Size: {item.sizeName}
              </p>
              <p className="text-sm text-muted-foreground">
                Placement: {item.placementName} • Print: {item.printSizeName}
              </p>
              <p className="mt-2 text-sm font-medium">
                Qty: {item.quantity} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.quantity * item.unitPrice)}
              </p>
            </div>
            <div className="flex gap-2">
              {onEditItem && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditItem(item)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <div className="border-t pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="text-cyan-600">{formatCurrency(getTotal())}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
