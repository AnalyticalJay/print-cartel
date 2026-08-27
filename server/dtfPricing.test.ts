import { describe, expect, it } from "vitest";
import { calculateDtfEstimate, getPrintSizeDimensions, UnsupportedPrintSizeError } from "../shared/dtfPricing";

describe("calculateDtfEstimate", () => {
  it("prices an A4 transfer by its physical proof area and quantity", () => {
    const estimate = calculateDtfEstimate({
      basePrice: 120,
      quantity: 2,
      printSelections: [{ printSize: "A4", previewScale: 1 }],
    });

    expect(estimate.garmentSubtotal).toBe(240);
    expect(estimate.transferAreaSquareMetres).toBeCloseTo(0.06237, 5);
    expect(estimate.transferSubtotal).toBe(18.72);
    expect(estimate.total).toBe(258.72);
  });

  it("reduces the transfer estimate when the mockup scale is reduced", () => {
    const fullSize = calculateDtfEstimate({ basePrice: 120, quantity: 1, printSelections: [{ printSize: "A4", previewScale: 1 }] });
    const halfSize = calculateDtfEstimate({ basePrice: 120, quantity: 1, printSelections: [{ printSize: "A4", previewScale: 0.5 }] });

    expect(halfSize.transferSubtotal).toBeLessThan(fullSize.transferSubtotal);
    expect(halfSize.selections[0].widthCm).toBe(10.5);
    expect(halfSize.selections[0].heightCm).toBe(14.8);
  });

  it("applies the shared 10% threshold at 10 garments", () => {
    const estimate = calculateDtfEstimate({ basePrice: 120, quantity: 10, printSelections: [] });

    expect(estimate.bulkDiscountPercentage).toBe(10);
    expect(estimate.total).toBe(1080);
  });

  it("normalises the approved Pocket label to the A6 printable dimensions", () => {
    expect(getPrintSizeDimensions("Pocket Size")).toEqual({ label: "A6", widthCm: 10.5, heightCm: 14.8 });
  });

  it("rejects unapproved print sizes rather than silently applying a generic square area", () => {
    expect(() => calculateDtfEstimate({
      basePrice: 120,
      quantity: 1,
      printSelections: [{ printSize: "Oversized custom 45 cm", previewScale: 1 }],
    })).toThrow(UnsupportedPrintSizeError);
  });
});
