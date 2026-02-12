import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DollarSign, Send } from "lucide-react";

interface QuoteGeneratorProps {
  orderId: number;
  basePrice: number;
  customerEmail: string;
  customerName: string;
  onQuoteCreated?: (quoteId: number) => void;
}

export function QuoteGenerator({
  orderId,
  basePrice,
  customerEmail,
  customerName,
  onQuoteCreated,
}: QuoteGeneratorProps) {
  const [adjustedPrice, setAdjustedPrice] = useState(basePrice);
  const [priceReason, setPriceReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteCreated, setQuoteCreated] = useState(false);
  const [currentQuoteId, setCurrentQuoteId] = useState<number | null>(null);

  const createQuoteMutation = trpc.quotes.create.useMutation();
  const sendQuoteMutation = trpc.quotes.send.useMutation();

  const priceAdjustment = adjustedPrice - basePrice;
  const adjustmentPercentage = ((priceAdjustment / basePrice) * 100).toFixed(1);

  const handleCreateQuote = async () => {
    try {
      setIsSubmitting(true);
      const result = await createQuoteMutation.mutateAsync({
        orderId,
        adjustedPrice,
        priceAdjustmentReason: priceReason || undefined,
        adminNotes: adminNotes || undefined,
        expiresInDays,
      });

      setCurrentQuoteId(result.quoteId);
      setQuoteCreated(true);
      toast.success("Quote created successfully");
      onQuoteCreated?.(result.quoteId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create quote";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendQuote = async () => {
    if (!currentQuoteId) return;

    try {
      setIsSubmitting(true);
      await sendQuoteMutation.mutateAsync({
        quoteId: currentQuoteId,
      });

      toast.success(`Quote sent to ${customerEmail}`);
      // Reset form
      setQuoteCreated(false);
      setCurrentQuoteId(null);
      setAdjustedPrice(basePrice);
      setPriceReason("");
      setAdminNotes("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send quote";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-white border-2 border-gray-200">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Generate Custom Quote</h3>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600">Customer: <span className="font-semibold">{customerName}</span></p>
            <p className="text-sm text-gray-600">Email: <span className="font-semibold">{customerEmail}</span></p>
            <p className="text-sm text-gray-600">Base Price: <span className="font-semibold text-accent">R{basePrice.toFixed(2)}</span></p>
          </div>
        </div>

        {!quoteCreated ? (
          <>
            {/* Adjusted Price */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                <DollarSign className="inline w-4 h-4 mr-1" />
                Adjusted Price
              </label>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    value={adjustedPrice}
                    onChange={(e) => setAdjustedPrice(parseFloat(e.target.value) || 0)}
                    className="border-2 border-gray-300"
                    placeholder="Enter adjusted price"
                  />
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {priceAdjustment >= 0 ? "+" : ""}{priceAdjustment.toFixed(2)} ({adjustmentPercentage}%)
                </div>
              </div>
            </div>

            {/* Price Adjustment Reason */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Price Adjustment Reason (Optional)
              </label>
              <Textarea
                value={priceReason}
                onChange={(e) => setPriceReason(e.target.value)}
                placeholder="e.g., Bulk discount, rush fee, quality upgrade..."
                className="border-2 border-gray-300 min-h-20"
              />
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Admin Notes (Internal)
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes about this quote..."
                className="border-2 border-gray-300 min-h-20"
              />
            </div>

            {/* Expiration */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Quote Expires In (Days)
              </label>
              <Input
                type="number"
                min="1"
                max="90"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
                className="border-2 border-gray-300"
              />
            </div>

            <Button
              onClick={handleCreateQuote}
              disabled={isSubmitting}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              {isSubmitting ? "Creating..." : "Create Quote"}
            </Button>
          </>
        ) : (
          <>
            <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
              <p className="text-sm text-green-800 font-semibold">✓ Quote created successfully</p>
              <p className="text-sm text-green-700 mt-1">Quote ID: #{currentQuoteId}</p>
              <p className="text-sm text-green-700">Adjusted Price: <span className="font-bold text-accent">R{adjustedPrice.toFixed(2)}</span></p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSendQuote}
                disabled={isSubmitting}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Sending..." : "Send to Customer"}
              </Button>
              <Button
                onClick={() => {
                  setQuoteCreated(false);
                  setCurrentQuoteId(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Create Another
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
