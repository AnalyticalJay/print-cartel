import { describe, expect, it } from "vitest";
import { createBackgroundRemovedFile, isImageFile } from "../client/src/lib/artworkProcessing";

describe("artwork processing helpers", () => {
  it("identifies image files without rejecting non-image artwork formats", () => {
    expect(isImageFile({ type: "image/png" })).toBe(true);
    expect(isImageFile({ type: "image/jpeg" })).toBe(true);
    expect(isImageFile({ type: "application/pdf" })).toBe(false);
  });

  it("creates a transparent PNG filename from the original artwork name", () => {
    const processed = createBackgroundRemovedFile(
      new Blob(["processed"], { type: "image/png" }),
      "club-logo.jpg"
    );

    expect(processed.name).toBe("club-logo-no-background.png");
    expect(processed.type).toBe("image/png");
  });

  it("uses a safe fallback name when the original name has no extension", () => {
    const processed = createBackgroundRemovedFile(
      new Blob(["processed"], { type: "image/png" }),
      ""
    );

    expect(processed.name).toBe("artwork-no-background.png");
  });
});
