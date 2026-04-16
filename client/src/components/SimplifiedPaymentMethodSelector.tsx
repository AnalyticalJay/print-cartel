import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Zap } from "lucide-react";

export type PaymentMethodType = "payfast" | "eft" | "bank_transfer";

interface SimplifiedPaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType | null;
  onMethodSelect: (method: PaymentMethodType) => void;
  isLoading?: boolean;
}

export function SimplifiedPaymentMethodSelector({
  selectedMethod,
  onMethodSelect,
  isLoading = false,
}: SimplifiedPaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">How would you like to pay?</h3>
        <p className="text-sm text-gray-400">Choose your preferred payment method</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* PayFast Option - Primary */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedMethod === "payfast"
              ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500"
              : "border-gray-700 hover:border-gray-600 bg-gray-800"
          }`}
          onClick={() => onMethodSelect("payfast")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <CardTitle className="text-base">PayFast (Recommended)</CardTitle>
              </div>
              {selectedMethod === "payfast" && (
                <Badge className="bg-cyan-500 text-white">Selected</Badge>
              )}
            </div>
            <CardDescription className="text-xs">Instant payment processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm text-gray-300">
              <p>✓ Instant confirmation</p>
              <p>✓ Secure payment gateway</p>
              <p>✓ Multiple payment options</p>
              <p>✓ Immediate order processing</p>
            </div>
            <Button
              variant={selectedMethod === "payfast" ? "default" : "outline"}
              size="sm"
              className="w-full"
              disabled={isLoading}
            >
              {selectedMethod === "payfast" ? "Selected" : "Select PayFast"}
            </Button>
          </CardContent>
        </Card>

        {/* Bank Transfer Option */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedMethod === "bank_transfer"
              ? "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500"
              : "border-gray-700 hover:border-gray-600 bg-gray-800"
          }`}
          onClick={() => onMethodSelect("bank_transfer")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-base">Bank Transfer</CardTitle>
              </div>
              {selectedMethod === "bank_transfer" && (
                <Badge className="bg-purple-500 text-white">Selected</Badge>
              )}
            </div>
            <CardDescription className="text-xs">Manual payment verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm text-gray-300">
              <p>✓ Direct bank transfer</p>
              <p>✓ EFT payment option</p>
              <p>✓ Manual verification</p>
              <p>✓ 1-3 business days processing</p>
            </div>
            <Button
              variant={selectedMethod === "bank_transfer" ? "default" : "outline"}
              size="sm"
              className="w-full"
              disabled={isLoading}
            >
              {selectedMethod === "bank_transfer" ? "Selected" : "Select Bank Transfer"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
        <p className="text-xs text-blue-200">
          💡 <strong>Tip:</strong> PayFast is the fastest way to complete your payment and get
          your order started immediately.
        </p>
      </div>
    </div>
  );
}
