export function getMockupExportFilename(productName?: string): string {
  const safeName = (productName || "custom-garment")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${safeName || "custom-garment"}-mockup.png`;
}
