import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, Maximize2, Minimize2 } from "lucide-react";

interface PrintPlacement {
  placement: string;
  uploadedFilePath?: string;
  imagePosition?: { x: number; y: number };
  rotation?: number;
  scale?: number;
}

interface PreviewCanvasProps {
  productName?: string;
  productImageUrl?: string | null;
  garmentColor: string;
  prints: PrintPlacement[];
  onImageReposition?: (placement: string, x: number, y: number) => void;
  onRotationChange?: (placement: string, rotation: number) => void;
  onScaleChange?: (placement: string, scale: number) => void;
}

export function PreviewCanvas({
  productName = "T-Shirt",
  productImageUrl,
  garmentColor,
  prints,
  onImageReposition,
  onRotationChange,
  onScaleChange,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedPlacement, setSelectedPlacement] = useState<string | null>(null);
  const [imagePositions, setImagePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [rotations, setRotations] = useState<Record<string, number>>({});
  const [scales, setScales] = useState<Record<string, number>>({});
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [productImageLoaded, setProductImageLoaded] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);

  const canvasWidth = 400;
  const canvasHeight = 500;

  // Placement areas for different garment areas
  const placementAreas: Record<string, { x: number; y: number; width: number; height: number }> = {
    front: { x: 100, y: 120, width: 200, height: 200 },
    back: { x: 100, y: 120, width: 200, height: 200 },
    sleeve: { x: 50, y: 150, width: 80, height: 120 },
  };

  // Preload all images
  useEffect(() => {
    const loadedImages: Record<string, HTMLImageElement> = {};
    let loadedCount = 0;
    let totalToLoad = prints.filter(p => p.uploadedFilePath).length;

    if (productImageUrl) {
      totalToLoad += 1;
      const productImg = new Image();
      productImg.onload = () => {
        loadedImages['product'] = productImg;
        setProductImageLoaded(true);
        loadedCount++;
        if (loadedCount === totalToLoad) {
          redrawCanvas(loadedImages);
        }
      };
      productImg.onerror = () => {
        console.error('Failed to load product image:', productImageUrl);
        setProductImageLoaded(true);
        loadedCount++;
        if (loadedCount === totalToLoad) {
          redrawCanvas(loadedImages);
        }
      };
      productImg.src = productImageUrl;
    }

    prints.forEach((print) => {
      if (print.uploadedFilePath) {
        const img = new Image();
        img.onload = () => {
          loadedImages[print.placement] = img;
          setImagesLoaded(prev => ({ ...prev, [print.placement]: true }));
          loadedCount++;
          if (loadedCount === totalToLoad) {
            redrawCanvas(loadedImages);
          }
        };
        img.onerror = () => {
          console.error('Failed to load design image:', print.uploadedFilePath);
          loadedCount++;
          if (loadedCount === totalToLoad) {
            redrawCanvas(loadedImages);
          }
        };
        img.src = print.uploadedFilePath;
      }
    });

    if (totalToLoad === 0) {
      redrawCanvas(loadedImages);
    }
  }, [productImageUrl, prints]);

  const redrawCanvas = (loadedImages: Record<string, HTMLImageElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, "#f5f5f5");
    gradient.addColorStop(1, "#e0e0e0");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw product image if available
    if (loadedImages['product']) {
      ctx.drawImage(loadedImages['product'], 0, 0, canvasWidth, canvasHeight);
      
      // Apply color overlay if product image is loaded
      if (garmentColor && garmentColor !== '#000000') {
        ctx.fillStyle = garmentColor;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.globalAlpha = 1.0;
      }
    } else {
      // Fallback: Draw garment body (T-shirt shape) with color
      ctx.fillStyle = garmentColor;
      
      // Main body
      ctx.beginPath();
      ctx.moveTo(80, 80);
      ctx.lineTo(320, 80);
      ctx.lineTo(320, 400);
      ctx.lineTo(80, 400);
      ctx.closePath();
      ctx.fill();

      // Left sleeve
      ctx.beginPath();
      ctx.moveTo(80, 100);
      ctx.lineTo(30, 120);
      ctx.lineTo(30, 200);
      ctx.lineTo(80, 180);
      ctx.closePath();
      ctx.fill();

      // Right sleeve
      ctx.beginPath();
      ctx.moveTo(320, 100);
      ctx.lineTo(370, 120);
      ctx.lineTo(370, 200);
      ctx.lineTo(320, 180);
      ctx.closePath();
      ctx.fill();
    }

    // Draw placement areas
    prints.forEach((print) => {
      const placement = print.placement as keyof typeof placementAreas;
      const coords = placementAreas[placement];
      
      if (coords) {
        const isSelected = selectedPlacement === print.placement;
        ctx.strokeStyle = isSelected ? "#FFD700" : "#999";
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(coords.x, coords.y, coords.width, coords.height);
        ctx.setLineDash([]);

        // Draw placement label
        ctx.fillStyle = isSelected ? "#FFD700" : "#666";
        ctx.font = "bold 12px Arial";
        ctx.fillText(print.placement.toUpperCase(), coords.x + 5, coords.y - 8);

        // Draw corner handles if selected
        if (isSelected) {
          const handleSize = 6;
          ctx.fillStyle = "#FFD700";
          // Top-left
          ctx.fillRect(coords.x - handleSize / 2, coords.y - handleSize / 2, handleSize, handleSize);
          // Top-right
          ctx.fillRect(coords.x + coords.width - handleSize / 2, coords.y - handleSize / 2, handleSize, handleSize);
          // Bottom-left
          ctx.fillRect(coords.x - handleSize / 2, coords.y + coords.height - handleSize / 2, handleSize, handleSize);
          // Bottom-right
          ctx.fillRect(coords.x + coords.width - handleSize / 2, coords.y + coords.height - handleSize / 2, handleSize, handleSize);
        }
      }
    });

    // Draw uploaded images
    prints.forEach((print) => {
      if (print.uploadedFilePath && loadedImages[print.placement]) {
        const placement = print.placement as keyof typeof placementAreas;
        const coords = placementAreas[placement];
        const position = imagePositions[print.placement] || { x: 0, y: 0 };
        const rotation = rotations[print.placement] || 0;
        const scale = scales[print.placement] || 1;

        if (coords) {
          const img = loadedImages[print.placement];
          
          ctx.save();

          // Calculate center for rotation
          const centerX = coords.x + coords.width / 2 + position.x;
          const centerY = coords.y + coords.height / 2 + position.y;

          ctx.translate(centerX, centerY);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(scale, scale);
          ctx.translate(-centerX, -centerY);

          ctx.drawImage(
            img,
            coords.x + position.x,
            coords.y + position.y,
            coords.width,
            coords.height
          );

          ctx.restore();

          // Draw selection indicator if selected
          if (selectedPlacement === print.placement) {
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(
              coords.x + position.x,
              coords.y + position.y,
              coords.width,
              coords.height
            );
            ctx.setLineDash([]);
          }
        }
      }
    });
  };

  // Redraw when state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, "#f5f5f5");
    gradient.addColorStop(1, "#e0e0e0");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw product image if available and loaded
    if (productImageUrl && productImageLoaded) {
      const productImg = new Image();
      productImg.onload = () => {
        ctx.drawImage(productImg, 0, 0, canvasWidth, canvasHeight);
        
        // Apply color overlay
        if (garmentColor && garmentColor !== '#000000') {
          ctx.fillStyle = garmentColor;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          ctx.globalAlpha = 1.0;
        }
        
        drawPlacementsAndDesigns(ctx);
      };
      productImg.src = productImageUrl;
    } else {
      // Fallback: Draw garment body (T-shirt shape) with color
      ctx.fillStyle = garmentColor;
      
      // Main body
      ctx.beginPath();
      ctx.moveTo(80, 80);
      ctx.lineTo(320, 80);
      ctx.lineTo(320, 400);
      ctx.lineTo(80, 400);
      ctx.closePath();
      ctx.fill();

      // Left sleeve
      ctx.beginPath();
      ctx.moveTo(80, 100);
      ctx.lineTo(30, 120);
      ctx.lineTo(30, 200);
      ctx.lineTo(80, 180);
      ctx.closePath();
      ctx.fill();

      // Right sleeve
      ctx.beginPath();
      ctx.moveTo(320, 100);
      ctx.lineTo(370, 120);
      ctx.lineTo(370, 200);
      ctx.lineTo(320, 180);
      ctx.closePath();
      ctx.fill();

      drawPlacementsAndDesigns(ctx);
    }
  }, [garmentColor, productImageUrl, productImageLoaded, imagePositions, rotations, scales, selectedPlacement, prints]);

  const drawPlacementsAndDesigns = (ctx: CanvasRenderingContext2D) => {
    // Draw placement areas
    prints.forEach((print) => {
      const placement = print.placement as keyof typeof placementAreas;
      const coords = placementAreas[placement];
      
      if (coords) {
        const isSelected = selectedPlacement === print.placement;
        ctx.strokeStyle = isSelected ? "#FFD700" : "#999";
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(coords.x, coords.y, coords.width, coords.height);
        ctx.setLineDash([]);

        // Draw placement label
        ctx.fillStyle = isSelected ? "#FFD700" : "#666";
        ctx.font = "bold 12px Arial";
        ctx.fillText(print.placement.toUpperCase(), coords.x + 5, coords.y - 8);

        // Draw corner handles if selected
        if (isSelected) {
          const handleSize = 6;
          ctx.fillStyle = "#FFD700";
          // Top-left
          ctx.fillRect(coords.x - handleSize / 2, coords.y - handleSize / 2, handleSize, handleSize);
          // Top-right
          ctx.fillRect(coords.x + coords.width - handleSize / 2, coords.y - handleSize / 2, handleSize, handleSize);
          // Bottom-left
          ctx.fillRect(coords.x - handleSize / 2, coords.y + coords.height - handleSize / 2, handleSize, handleSize);
          // Bottom-right
          ctx.fillRect(coords.x + coords.width - handleSize / 2, coords.y + coords.height - handleSize / 2, handleSize, handleSize);
        }
      }
    });

    // Draw uploaded images
    prints.forEach((print) => {
      if (print.uploadedFilePath) {
        const placement = print.placement as keyof typeof placementAreas;
        const coords = placementAreas[placement];
        const position = imagePositions[print.placement] || { x: 0, y: 0 };
        const rotation = rotations[print.placement] || 0;
        const scale = scales[print.placement] || 1;

        if (coords && imagesLoaded[print.placement]) {
          const img = new Image();
          img.onload = () => {
            ctx.save();

            // Calculate center for rotation
            const centerX = coords.x + coords.width / 2 + position.x;
            const centerY = coords.y + coords.height / 2 + position.y;

            ctx.translate(centerX, centerY);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(scale, scale);
            ctx.translate(-centerX, -centerY);

            ctx.drawImage(
              img,
              coords.x + position.x,
              coords.y + position.y,
              coords.width,
              coords.height
            );

            ctx.restore();

            // Draw selection indicator if selected
            if (selectedPlacement === print.placement) {
              ctx.strokeStyle = "#FFD700";
              ctx.lineWidth = 2;
              ctx.setLineDash([3, 3]);
              ctx.strokeRect(
                coords.x + position.x,
                coords.y + position.y,
                coords.width,
                coords.height
              );
              ctx.setLineDash([]);
            }
          };
          img.src = print.uploadedFilePath;
        }
      }
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check which placement area was clicked
    for (const [placement, coords] of Object.entries(placementAreas)) {
      if (
        x >= coords.x &&
        x <= coords.x + coords.width &&
        y >= coords.y &&
        y <= coords.y + coords.height
      ) {
        setSelectedPlacement(placement);
        return;
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedPlacement) return;

    const placement = selectedPlacement as keyof typeof placementAreas;
    const coords = placementAreas[placement];
    if (!coords) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (
      x >= coords.x &&
      x <= coords.x + coords.width &&
      y >= coords.y &&
      y <= coords.y + coords.height
    ) {
      setIsDragging(true);
      const position = imagePositions[selectedPlacement] || { x: 0, y: 0 };
      setDragOffset({
        x: x - position.x,
        y: y - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCursorPosition({ x, y });

    if (!isDragging || !selectedPlacement) return;

    const placement = selectedPlacement as keyof typeof placementAreas;
    const coords = placementAreas[placement];
    if (!coords) return;

    let newX = x - dragOffset.x;
    let newY = y - dragOffset.y;

    // Constrain within placement bounds
    newX = Math.max(-coords.width / 2, Math.min(coords.width / 2, newX));
    newY = Math.max(-coords.height / 2, Math.min(coords.height / 2, newY));

    const newPositions = { ...imagePositions, [selectedPlacement]: { x: newX, y: newY } };
    setImagePositions(newPositions);
    onImageReposition?.(selectedPlacement, newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    handleMouseDown(mouseEvent as any);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    handleMouseMove(mouseEvent as any);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  const handleRotation = (angle: number) => {
    if (!selectedPlacement) return;
    const newRotations = { ...rotations, [selectedPlacement]: angle };
    setRotations(newRotations);
    onRotationChange?.(selectedPlacement, angle);
  };

  const handleScale = (newScale: number) => {
    if (!selectedPlacement) return;
    const scale = Math.max(0.5, Math.min(2, newScale));
    const newScales = { ...scales, [selectedPlacement]: scale };
    setScales(newScales);
    onScaleChange?.(selectedPlacement, scale);
  };

  const currentRotation = selectedPlacement ? rotations[selectedPlacement] || 0 : 0;
  const currentScale = selectedPlacement ? scales[selectedPlacement] || 1 : 1;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <h3 className="font-semibold text-lg text-white">{productName}</h3>
        <p className="text-sm text-gray-400">Click on a placement area to edit</p>
      </div>

      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`${isDragging ? "cursor-grabbing" : "cursor-move"} block`}
        />
      </div>

      {selectedPlacement && (
        <>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">
              Editing: <span className="text-accent">{selectedPlacement.toUpperCase()}</span>
            </p>
            {cursorPosition && (
              <p className="text-xs text-gray-400 mt-1">
                Position: ({Math.round(cursorPosition.x)}, {Math.round(cursorPosition.y)})
              </p>
            )}
          </div>

          {/* Rotation Controls */}
          <div className="flex gap-2 items-center flex-wrap justify-center">
            <span className="text-sm font-semibold text-gray-300">Rotate:</span>
            {[0, 90, 180, 270].map((angle) => (
              <button
                key={angle}
                onClick={() => handleRotation(angle)}
                className={`px-3 py-2 rounded font-semibold text-sm transition-colors ${
                  currentRotation === angle
                    ? "bg-accent text-black"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {angle}°
              </button>
            ))}
          </div>

          {/* Scale Controls */}
          <div className="flex gap-2 items-center justify-center">
            <span className="text-sm font-semibold text-gray-300">Scale:</span>
            <button
              onClick={() => handleScale(currentScale - 0.1)}
              disabled={currentScale <= 0.5}
              className="p-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Decrease size"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-300 w-12 text-center">
              {(currentScale * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => handleScale(currentScale + 0.1)}
              disabled={currentScale >= 2}
              className="p-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Increase size"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      <div className="text-sm text-gray-400 text-center max-w-sm">
        <p>Click placement areas to select them, then drag to reposition. Use rotation and scale controls to adjust your design.</p>
      </div>
    </div>
  );
}
