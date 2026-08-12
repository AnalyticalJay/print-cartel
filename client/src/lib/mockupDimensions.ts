export interface PrintSizeDimensions {
  label: string;
  widthCm: number;
  heightCm: number;
}

const PRINT_SIZE_DIMENSIONS: Record<string, PrintSizeDimensions> = {
  a6: { label: "A6", widthCm: 10.5, heightCm: 14.8 },
  a5: { label: "A5", widthCm: 14.8, heightCm: 21 },
  a4: { label: "A4", widthCm: 21, heightCm: 29.7 },
  a3: { label: "A3", widthCm: 29.7, heightCm: 42 },
};

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
