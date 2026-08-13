import { describe, expect, it } from "vitest";
import {
  clampPreviewPosition,
  clampPreviewScale,
  getPlacementRegion,
  getPreviewOffsetLimits,
  nudgePreviewPosition,
  normalizePreviewRotation,
  snapPreviewPosition,
} from "../client/src/lib/mockupGeometry";
import {
  convertCentimetresToInches,
  getArtworkDimensions,
  getPrintSizeDimensions,
} from "../client/src/lib/mockupDimensions";
import { getGridContrastColors } from "../client/src/lib/gridContrast";
import {
  getMockupPreviewVisibility,
  getMockupUploadButtonState,
  getSelectedMockupGarmentColor,
  isMockupAutoRotateActive,
} from "../client/src/lib/mockupPreview";

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

  it("nudges artwork independently while keeping it inside the active placement bounds", () => {
    expect(nudgePreviewPosition(4, -3, 2, 1, { x: 6, y: 4 })).toEqual({ x: 6, y: -2 });
    expect(nudgePreviewPosition(6, 4, 1, 1, { x: 6, y: 4 })).toEqual({ x: 6, y: 4 });
  });

  it("converts standard print sizes to centimetres and applies scale", () => {
    expect(getPrintSizeDimensions("A4")).toMatchObject({ widthCm: 21, heightCm: 29.7 });
    expect(getArtworkDimensions("A4", 0.6)).toMatchObject({ widthCm: 12.6, heightCm: 17.8 });
    expect(getArtworkDimensions("A3", 1).heightCm).toBe(42);
    expect(convertCentimetresToInches(2.54)).toBe(1);
    expect(convertCentimetresToInches(21)).toBe(8.27);
  });

  it("snaps artwork offsets to printable grid increments", () => {
    expect(snapPreviewPosition(8.9, -9.2, 40, 38)).toEqual({ x: 10, y: -9.5 });
    expect(snapPreviewPosition(0.4, -0.2, 40, 38)).toEqual({ x: 0, y: 0 });
  });

  it("chooses dark lines for light garments and light lines for dark garments", () => {
    expect(getGridContrastColors("#ffffff").mode).toBe("light");
    expect(getGridContrastColors("#ffffff").lineColor).toContain("15, 23, 42");
    expect(getGridContrastColors("#111111").mode).toBe("dark");
    expect(getGridContrastColors("#111111").lineColor).toContain("255, 255, 255");
  });

  it("hides editing guides and disables artwork editing in clean preview mode", () => {
    expect(getMockupPreviewVisibility(false, true)).toEqual({
      showGuides: true,
      showAlignmentGrid: true,
      allowArtworkEditing: true,
    });
    expect(getMockupPreviewVisibility(true, true)).toEqual({
      showGuides: false,
      showAlignmentGrid: false,
      allowArtworkEditing: false,
    });
  });

  it("only runs auto-rotate while clean preview mode is active", () => {
    expect(isMockupAutoRotateActive(false, true)).toBe(false);
    expect(isMockupAutoRotateActive(true, false)).toBe(false);
    expect(isMockupAutoRotateActive(true, true)).toBe(true);
  });

  it("uses the selected available garment colour and falls back safely", () => {
    const colors = [
      { id: 11, colorHex: "#111111" },
      { id: 12, colorHex: "#f5f5f5" },
    ];

    expect(getSelectedMockupGarmentColor(colors, 12, "#d1d5db")).toBe("#f5f5f5");
    expect(getSelectedMockupGarmentColor(colors, 99, "#d1d5db")).toBe("#d1d5db");
  });

  it("shows an upload or replace action only when a placement is active", () => {
    expect(getMockupUploadButtonState(null, false, false)).toEqual({
      canUpload: false,
      label: "Choose placement",
    });
    expect(getMockupUploadButtonState(1, false, false)).toEqual({
      canUpload: true,
      label: "Upload artwork",
    });
    expect(getMockupUploadButtonState(1, true, false)).toEqual({
      canUpload: true,
      label: "Replace artwork",
    });
    expect(getMockupUploadButtonState(1, true, true)).toEqual({
      canUpload: false,
      label: "Uploading…",
    });
  });

  it("normalizes rotation controls to a 0-359 degree range", () => {
    expect(normalizePreviewRotation(-15)).toBe(345);
    expect(normalizePreviewRotation(360)).toBe(0);
    expect(normalizePreviewRotation(375)).toBe(15);
  });
});
