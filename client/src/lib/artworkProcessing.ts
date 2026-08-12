export function isImageFile(file: Pick<File, "type">): boolean {
  return file.type.startsWith("image/");
}

export function createBackgroundRemovedFile(blob: Blob, originalName: string): File {
  const fileBaseName = originalName.replace(/\.[^/.]+$/, "") || "artwork";
  return new File([blob], `${fileBaseName}-no-background.png`, {
    type: "image/png",
    lastModified: Date.now(),
  });
}
