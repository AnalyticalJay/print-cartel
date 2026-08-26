/**
 * Shared DTF pricing contract.
 * The current transfer rate is an estimate-facing rate card. VAT, delivery, and account-specific
 * agreements stay outside this calculator until the checkout service supplies them authoritatively.
 */
export const DTF_TRANSFER_RATE_PER_SQUARE_METER = 150;

export interface PrintSizeDimensions {
  label: string;
  widthCm: number;
  heightCm: number;
}

export interface DtfPricingSelection {
  printSize: string;
  previewScale?: number;
}

export interface DtfPricedSelection extends DtfPricingSelection {
  widthCm: number;
  heightCm: number;
  areaSquareMetres: number;
  transferPricePerGarment: number;
}

export interface DtfEstimate {
  basePrice: number;
  quantity: number;
  garmentSubtotal: number;
  transferSubtotal: number;
  transferAreaSquareMetres: number;
  totalBeforeDiscount: number;
  bulkDiscountPercentage: number;
  bulkDiscount: number;
  total: number;
  totalPerGarment: number;
  selections: DtfPricedSelection[];
}

const PRINT_SIZE_DIMENSIONS: Record<string, PrintSizeDimensions> = {
  a6: { label: "A6", widthCm: 10.5, heightCm: 14.8 },
  a5: { label: "A5", widthCm: 14.8, heightCm: 21 },
  a4: { label: "A4", widthCm: 21, heightCm: 29.7 },
  a3: { label: "A3", widthCm: 29.7, heightCm: 42 },
};

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function getPrintSizeDimensions(printSize?: string): PrintSizeDimensions {
  const normalized = printSize?.trim().toLowerCase() ?? "";
  const matchedKey = Object.keys(PRINT_SIZE_DIMENSIONS).find((key) => normalized.includes(key));

  return matchedKey
    ? PRINT_SIZE_DIMENSIONS[matchedKey]
    : { label: printSize || "Custom", widthCm: 20, heightCm: 20 };
}

export function getArtworkDimensions(printSize: string | undefined, scale: number): PrintSizeDimensions {
  const base = getPrintSizeDimensions(printSize);
  const safeScale = Math.max(0, Math.min(1, scale));
  return {
    label: base.label,
    widthCm: Number((base.widthCm * safeScale).toFixed(1)),
    heightCm: Number((base.heightCm * safeScale).toFixed(1)),
  };
}

export function getBulkDiscountPercentage(quantity: number): number {
  if (quantity >= 100) return 30;
  if (quantity >= 50) return 20;
  if (quantity >= 10) return 10;
  return 0;
}

export function calculateDtfEstimate({
  basePrice,
  quantity,
  printSelections,
}: {
  basePrice: number;
  quantity: number;
  printSelections: DtfPricingSelection[];
}): DtfEstimate {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const safeBasePrice = Math.max(0, Number(basePrice) || 0);
  const selections = printSelections.map((selection) => {
    const base = getPrintSizeDimensions(selection.printSize);
    const scale = Math.max(0, Math.min(1, selection.previewScale ?? 1));
    const widthCm = Number((base.widthCm * scale).toFixed(1));
    const heightCm = Number((base.heightCm * scale).toFixed(1));
    const areaSquareMetres = (widthCm * heightCm) / 10_000;
    return {
      ...selection,
      widthCm,
      heightCm,
      areaSquareMetres,
      transferPricePerGarment: roundCurrency(areaSquareMetres * DTF_TRANSFER_RATE_PER_SQUARE_METER),
    };
  });
  const garmentSubtotal = roundCurrency(safeBasePrice * safeQuantity);
  const transferAreaSquareMetres = selections.reduce((sum, selection) => sum + selection.areaSquareMetres, 0);
  const transferSubtotal = roundCurrency(selections.reduce((sum, selection) => sum + selection.transferPricePerGarment, 0) * safeQuantity);
  const totalBeforeDiscount = roundCurrency(garmentSubtotal + transferSubtotal);
  const bulkDiscountPercentage = getBulkDiscountPercentage(safeQuantity);
  const bulkDiscount = roundCurrency((totalBeforeDiscount * bulkDiscountPercentage) / 100);
  const total = roundCurrency(totalBeforeDiscount - bulkDiscount);

  return {
    basePrice: safeBasePrice,
    quantity: safeQuantity,
    garmentSubtotal,
    transferSubtotal,
    transferAreaSquareMetres,
    totalBeforeDiscount,
    bulkDiscountPercentage,
    bulkDiscount,
    total,
    totalPerGarment: roundCurrency(total / safeQuantity),
    selections,
  };
}

export function formatZar(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
