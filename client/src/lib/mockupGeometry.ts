export interface PlacementRegion {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Percentage-based print regions used by the interactive garment mockup. */
export function getPlacementRegion(placementName: string): PlacementRegion {
  const normalized = placementName.toLowerCase();

  if (normalized.includes("left sleeve")) {
    return { left: 11, top: 34, width: 18, height: 28 };
  }
  if (normalized.includes("right sleeve")) {
    return { left: 71, top: 34, width: 18, height: 28 };
  }
  if (normalized.includes("sleeve")) {
    return { left: 71, top: 34, width: 18, height: 28 };
  }
  if (normalized.includes("pocket")) {
    return { left: 43, top: 39, width: 16, height: 16 };
  }
  if (normalized.includes("collar") || normalized.includes("neck")) {
    return { left: 42, top: 23, width: 16, height: 10 };
  }

  // Front and back both use a central chest/back print area.
  return { left: 30, top: 29, width: 40, height: 38 };
}

export function clampPreviewPosition(value: number, limit = 24): number {
  return Math.max(-limit, Math.min(limit, value));
}

export function clampPreviewScale(value: number): number {
  // A scale above 100% would make the artwork larger than its printable box.
  return Math.max(0.6, Math.min(1, value));
}

export function normalizePreviewRotation(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function snapPreviewOffset(value: number, regionSize: number, divisions = 4): number {
  if (!Number.isFinite(value) || !Number.isFinite(regionSize) || regionSize <= 0 || divisions <= 0) {
    return 0;
  }

  const step = regionSize / divisions;
  return Number((Math.round(value / step) * step).toFixed(4));
}

export function snapPreviewPosition(
  x: number,
  y: number,
  regionWidth: number,
  regionHeight: number,
  divisions = 4
): { x: number; y: number } {
  return {
    x: snapPreviewOffset(x, regionWidth, divisions),
    y: snapPreviewOffset(y, regionHeight, divisions),
  };
}

/**
 * Returns the maximum safe percentage offset from the centre of a placement.
 * Rotation is included so the artwork's rotated corners remain inside the box.
 */
export function getPreviewOffsetLimits(
  regionWidth: number,
  regionHeight: number,
  scale: number,
  rotation: number
): { x: number; y: number } {
  const safeScale = Math.max(0, Math.min(1, scale));
  const radians = (normalizePreviewRotation(rotation) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const artworkWidth = regionWidth * safeScale;
  const artworkHeight = regionHeight * safeScale;
  const rotatedWidth = artworkWidth * cos + artworkHeight * sin;
  const rotatedHeight = artworkWidth * sin + artworkHeight * cos;

  return {
    x: Math.max(0, (regionWidth - rotatedWidth) / 2),
    y: Math.max(0, (regionHeight - rotatedHeight) / 2),
  };
}

export function nudgePreviewPosition(
  x: number,
  y: number,
  deltaX: number,
  deltaY: number,
  limits: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: clampPreviewPosition(x + deltaX, limits.x),
    y: clampPreviewPosition(y + deltaY, limits.y),
  };
}
