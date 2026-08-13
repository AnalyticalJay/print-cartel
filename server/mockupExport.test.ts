import { describe, expect, it } from "vitest";
import { getMockupExportFilename } from "../client/src/lib/mockupExport";

describe("mockup export", () => {
  it("creates a clean PNG filename from a garment name", () => {
    expect(getMockupExportFilename("Unisex Classic Tee")).toBe("unisex-classic-tee-mockup.png");
  });

  it("uses a safe fallback when no garment name is available", () => {
    expect(getMockupExportFilename()).toBe("custom-garment-mockup.png");
  });
});
