import {
  getArtworkDimensions as getSharedArtworkDimensions,
  getPrintSizeDimensions as getSharedPrintSizeDimensions,
  type PrintSizeDimensions,
} from "@shared/dtfPricing";

export type { PrintSizeDimensions };

export const getPrintSizeDimensions = getSharedPrintSizeDimensions;
export const getArtworkDimensions = getSharedArtworkDimensions;

export function convertCentimetresToInches(valueCm: number): number {
  return Number((valueCm / 2.54).toFixed(2));
}
