import { describe, expect, it } from "vitest";
import {
  deleteArtworkLayer,
  duplicateArtworkLayer,
  moveArtworkLayer,
  normalizeArtworkLayerOrder,
} from "../client/src/lib/mockupLayers";

describe("artwork layer management", () => {
  const baseLayers = [
    { layerId: "front-logo", previewLayerOrder: 0, previewX: 0, previewY: 0 },
    { layerId: "front-text", previewLayerOrder: 1, previewX: 5, previewY: 4 },
  ];

  it("duplicates a layer with a new ID, offset position, and adjacent order", () => {
    const layers = duplicateArtworkLayer(baseLayers, "front-logo", "front-logo-copy");
    expect(layers.map((layer) => layer.layerId)).toEqual(["front-logo", "front-logo-copy", "front-text"]);
    expect(layers[1]).toMatchObject({ previewX: 2, previewY: 2, previewLayerOrder: 1 });
  });

  it("moves layers forward and backward while normalizing order", () => {
    expect(moveArtworkLayer(baseLayers, "front-logo", "forward").map((layer) => layer.layerId)).toEqual([
      "front-text",
      "front-logo",
    ]);
    expect(moveArtworkLayer(baseLayers, "front-text", "backward").map((layer) => layer.layerId)).toEqual([
      "front-text",
      "front-logo",
    ]);
  });

  it("deletes a layer and reindexes the remaining layer order", () => {
    expect(deleteArtworkLayer(baseLayers, "front-logo")).toEqual([
      { layerId: "front-text", previewLayerOrder: 0, previewX: 5, previewY: 4 },
    ]);
    expect(normalizeArtworkLayerOrder(baseLayers).map((layer) => layer.previewLayerOrder)).toEqual([0, 1]);
  });
});
