import { describe, expect, it } from "vitest";
import {
  clampPreviewPosition,
  clampPreviewScale,
  getPlacementRegion,
  normalizePreviewRotation,
} from "../client/src/lib/mockupGeometry";

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
    expect(clampPreviewScale(3)).toBe(1.5);
    expect(clampPreviewScale(1.1)).toBe(1.1);
  });

  it("normalizes rotation controls to a 0-359 degree range", () => {
    expect(normalizePreviewRotation(-15)).toBe(345);
    expect(normalizePreviewRotation(360)).toBe(0);
    expect(normalizePreviewRotation(375)).toBe(15);
  });
});
