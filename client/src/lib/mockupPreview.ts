export interface MockupPreviewVisibility {
  showGuides: boolean;
  showAlignmentGrid: boolean;
  allowArtworkEditing: boolean;
}

export function getMockupPreviewVisibility(
  isPreviewMode: boolean,
  alignmentGridEnabled: boolean
): MockupPreviewVisibility {
  return {
    showGuides: !isPreviewMode,
    showAlignmentGrid: !isPreviewMode && alignmentGridEnabled,
    allowArtworkEditing: !isPreviewMode,
  };
}

export function isMockupAutoRotateActive(isMockupPreview: boolean, isAutoRotating: boolean): boolean {
  return isMockupPreview && isAutoRotating;
}

export function getMockupSpinControlLabel(isMockupPreview: boolean, isAutoRotating: boolean): string {
  if (!isMockupPreview) return "Preview in 360°";
  return isAutoRotating ? "Stop 360° spin" : "Start 360° spin";
}

export interface MockupGarmentColor {
  id: number;
  colorHex: string;
}

export function getSelectedMockupGarmentColor(
  colors: MockupGarmentColor[],
  selectedColorId: number | null | undefined,
  fallbackColor: string
): string {
  return colors.find((color) => color.id === selectedColorId)?.colorHex || fallbackColor;
}

export function getMockupUploadButtonState(
  activeLayerId: string | null,
  hasArtwork: boolean,
  isUploading: boolean
): { canUpload: boolean; label: string } {
  if (isUploading) return { canUpload: false, label: "Uploading…" };
  if (activeLayerId === null) return { canUpload: false, label: "Choose placement" };
  return { canUpload: true, label: hasArtwork ? "Replace artwork" : "Upload artwork" };
}
