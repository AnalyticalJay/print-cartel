import { describe, expect, it } from "vitest";
import {
  clampPreviewPosition,
  clampPreviewScale,
  getPlacementRegion,
  getPreviewOffsetLimits,
  normalizePreviewRotation,
} from "../client/src/lib/mockupGeometry";
import { getArtworkDimensions, getPrintSizeDimensions } from "../client/src/lib/mockupDimensions";

describe("interactive garment mockup geometry", () => {
  it("maps common garment placements to useful percentage regions", () => {
    expect(getPlacementRegion("Front")).toEqual({ left: 30, top: 29, width: 40, height: 38 });
    expect(getPlacementRegion("Left Sleeve").left).toBe(11);
    expect(getPlacementRegion("Right Sleeve").left).toBe(71);
    expect(getPlacementRegion("Pocket").width).toBe(16);
  });

  it("keeps drag offsets within the placement bounds", () => {
    expect(clampPreviewPosition(40, 18)).toBe(18);
    expect(clampPreviewPosition(-40, 18)).toBe(-18);
    expect(clampPreviewPosition(6, 18)).toBe(6);
  });

  it("keeps artwork scale within the supported range", () => {
    expect(clampPreviewScale(0.1)).toBe(0.6);
    expect(clampPreviewScale(3)).toBe(1);
    expect(clampPreviewScale(1.1)).toBe(1);
  });

  it("keeps rotated artwork inside the printable region", () => {
    expect(getPreviewOffsetLimits(40, 38, 1, 0)).toEqual({ x: 0, y: 0 });
    expect(getPreviewOffsetLimits(40, 38, 0.6, 0).x).toBeGreaterThan(0);
    expect(getPreviewOffsetLimits(40, 38, 0.6, 45).x).toBeGreaterThanOrEqual(0);
    expect(getPreviewOffsetLimits(40, 38, 0.6, 45).y).toBeGreaterThanOrEqual(0);
  });

  it("converts standard print sizes to centimetres and applies scale", () => {
    expect(getPrintSizeDimensions("A4")).toMatchObject({ widthCm: 21, heightCm: 29.7 });
    expect(getArtworkDimensions("A4", 0.6)).toMatchObject({ widthCm: 12.6, heightCm: 17.8 });
    expect(getArtworkDimensions("A3", 1).heightCm).toBe(42);
  });

  it("normalizes rotation controls to a 0-359 degree range", () => {
    expect(normalizePreviewRotation(-15)).toBe(345);
    expect(normalizePreviewRotation(360)).toBe(0);
    expect(normalizePreviewRotation(375)).toBe(15);
  });
});
