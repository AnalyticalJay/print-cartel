import { CreditCard, Banknote, DollarSign, Wallet } from "lucide-react";
import { ReactNode } from "react";

export type PaymentMethodType = "credit_card" | "bank_transfer" | "cash" | "eft" | "paypal" | "other";

interface PaymentMethodConfig {
  label: string;
  icon: ReactNode;
  color: string;
  bgColor: string;
  description: string;
}

const paymentMethodConfigs: Record<PaymentMethodType, PaymentMethodConfig> = {
  credit_card: {
    label: "Credit Card",
    icon: <CreditCard className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "Visa, Mastercard, or other credit cards",
  },
  bank_transfer: {
    label: "Bank Transfer",
    icon: <Banknote className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-50",
    description: "Direct bank transfer or EFT",
  },
  eft: {
    label: "EFT",
    icon: <Banknote className="w-4 h-4" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    description: "Electronic Funds Transfer",
  },
  cash: {
    label: "Cash",
    icon: <DollarSign className="w-4 h-4" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    description: "Cash payment",
  },
  paypal: {
    label: "PayPal",
    icon: <Wallet className="w-4 h-4" />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    description: "PayPal payment",
  },
  other: {
    label: "Other",
    icon: <Wallet className="w-4 h-4" />,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    description: "Other payment method",
  },
};

/**
 * Normalize payment method string to standard type
 * Handles various input formats (snake_case, spaces, mixed case)
 */
export function normalizePaymentMethod(method: string | null | undefined): PaymentMethodType {
  if (!method) return "other";

  const normalized = method.toLowerCase().trim().replace(/\s+/g, "_");

  // Direct match
  if (normalized in paymentMethodConfigs) {
    return normalized as PaymentMethodType;
  }

  // Fuzzy matching for common variations
  if (normalized.includes("credit") || normalized.includes("card") || normalized.includes("visa")) {
    return "credit_card";
  }
  if (normalized.includes("bank") || normalized.includes("transfer") || normalized.includes("eft")) {
    return "bank_transfer";
  }
  if (normalized.includes("cash")) {
    return "cash";
  }
  if (normalized.includes("paypal")) {
    return "paypal";
  }

  return "other";
}

/**
 * Get payment method configuration
 */
export function getPaymentMethodConfig(method: string | null | undefined): PaymentMethodConfig {
  const normalized = normalizePaymentMethod(method);
  return paymentMethodConfigs[normalized];
}

/**
 * Get payment method icon component
 */
export function getPaymentMethodIcon(method: string | null | undefined): ReactNode {
  return getPaymentMethodConfig(method).icon;
}

/**
 * Get payment method label
 */
export function getPaymentMethodLabel(method: string | null | undefined): string {
  return getPaymentMethodConfig(method).label;
}

/**
 * Get all available payment methods for filtering
 */
export function getAllPaymentMethods(): Array<{ value: PaymentMethodType; label: string }> {
  return Object.entries(paymentMethodConfigs).map(([key, config]) => ({
    value: key as PaymentMethodType,
    label: config.label,
  }));
}

/**
 * Payment Method Badge Component
 * Displays payment method with icon and label
 */
export function PaymentMethodBadge({ method }: { method: string | null | undefined }) {
  const config = getPaymentMethodConfig(method);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor}`}>
      <span className={config.color}>{config.icon}</span>
      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}

/**
 * Payment Method Icon Component
 * Displays only the icon with tooltip
 */
export function PaymentMethodIconOnly({ method }: { method: string | null | undefined }) {
  const config = getPaymentMethodConfig(method);

  return (
    <div
      title={config.description}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${config.bgColor} cursor-help`}
    >
      <span className={config.color}>{config.icon}</span>
    </div>
  );
}
