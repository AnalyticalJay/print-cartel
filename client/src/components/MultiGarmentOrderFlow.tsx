import { useState } from "react";
import { useOrderCart, CartLineItem } from "@/hooks/useOrderCart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderCartSummary } from "./OrderCartSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ShoppingCart, CheckCircle } from "lucide-react";

interface MultiGarmentOrderFlowProps {
  onOrderReady?: (items: CartLineItem[]) => void;
  children?: React.ReactNode; // The OrderWizard component
}

export function MultiGarmentOrderFlow({ onOrderReady, children }: MultiGarmentOrderFlowProps) {
  const { items, clearCart } = useOrderCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeTab, setActiveTab] = useState<"wizard" | "review">("wizard");

  const handleAddGarment = () => {
    // Switch to wizard tab to add another garment
    setActiveTab("wizard");
  };

  const handleReviewOrder = () => {
    if (items.length === 0) {
      alert("Please add at least one garment to your order");
      return;
    }
    setActiveTab("review");
  };

  const handleCheckout = () => {
    if (onOrderReady) {
      onOrderReady(items);
    }
    setShowCheckout(true);
  };

  const handleNewOrder = () => {
    clearCart();
    setShowCheckout(false);
    setActiveTab("wizard");
  };

  if (showCheckout) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Submitted Successfully!</h2>
          <p className="text-muted-foreground mb-6">
            Your order with {items.length} garment(s) has been submitted. You'll receive a confirmation email shortly.
          </p>
          <Button onClick={handleNewOrder} className="bg-cyan-600 hover:bg-cyan-700">
            Start New Order
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "wizard" | "review")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wizard">
            <Plus className="h-4 w-4 mr-2" />
            Add Garments
          </TabsTrigger>
          <TabsTrigger value="review">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Review Order ({items.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wizard" className="space-y-6">
          {children}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleAddGarment}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Garment
            </Button>
            {items.length > 0 && (
              <Button
                onClick={handleReviewOrder}
                className="bg-cyan-600 hover:bg-cyan-700 gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Review Order ({items.length} items)
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <OrderCartSummary />
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => setActiveTab("wizard")}
              variant="outline"
            >
              Add More Garments
            </Button>
            <Button
              onClick={handleCheckout}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Proceed to Checkout
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
