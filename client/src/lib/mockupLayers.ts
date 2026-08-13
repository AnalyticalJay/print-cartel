export interface ArtworkLayer {
  layerId: string;
  previewLayerOrder?: number;
}

export function createArtworkLayerId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `artwork-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function orderArtworkLayers<T extends ArtworkLayer>(layers: T[]): T[] {
  return layers
    .map((layer, index) => ({ layer, index }))
    .sort((a, b) => (a.layer.previewLayerOrder ?? a.index) - (b.layer.previewLayerOrder ?? b.index))
    .map(({ layer }) => layer);
}

export function normalizeArtworkLayerOrder<T extends ArtworkLayer>(layers: T[]): T[] {
  return orderArtworkLayers(layers).map((layer, index) => ({ ...layer, previewLayerOrder: index }));
}

export function moveArtworkLayer<T extends ArtworkLayer>(
  layers: T[],
  layerId: string,
  direction: "forward" | "backward"
): T[] {
  const ordered = orderArtworkLayers(layers);
  const index = ordered.findIndex((layer) => layer.layerId === layerId);
  if (index === -1) return normalizeArtworkLayerOrder(layers);

  const destination = direction === "forward" ? index + 1 : index - 1;
  if (destination < 0 || destination >= ordered.length) return normalizeArtworkLayerOrder(ordered);

  [ordered[index], ordered[destination]] = [ordered[destination], ordered[index]];
  return ordered.map((layer, nextIndex) => ({ ...layer, previewLayerOrder: nextIndex }));
}

export function deleteArtworkLayer<T extends ArtworkLayer>(layers: T[], layerId: string): T[] {
  return normalizeArtworkLayerOrder(layers.filter((layer) => layer.layerId !== layerId));
}

export function duplicateArtworkLayer<T extends ArtworkLayer>(
  layers: T[],
  layerId: string,
  newLayerId: string
): T[] {
  const ordered = orderArtworkLayers(layers);
  const sourceIndex = ordered.findIndex((layer) => layer.layerId === layerId);
  if (sourceIndex === -1) return normalizeArtworkLayerOrder(layers);

  const source = ordered[sourceIndex];
  const copy = {
    ...source,
    layerId: newLayerId,
    previewX: ((source as T & { previewX?: number }).previewX ?? 0) + 2,
    previewY: ((source as T & { previewY?: number }).previewY ?? 0) + 2,
  } as T;

  ordered.splice(sourceIndex + 1, 0, copy);
  return normalizeArtworkLayerOrder(ordered);
}
