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
  return Math.max(0.6, Math.min(1.5, value));
}
