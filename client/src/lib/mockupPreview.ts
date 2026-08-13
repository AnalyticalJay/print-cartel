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

export function isMockupAutoRotateActive(
  isPreviewMode: boolean,
  autoRotateEnabled: boolean
): boolean {
  return isPreviewMode && autoRotateEnabled;
}
