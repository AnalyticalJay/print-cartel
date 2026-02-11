import { useEffect, useRef, useState } from "react";

interface PreviewCanvasProps {
  garmentColor: string;
  uploadedImageUrl?: string;
  placementCoordinates?: { x: number; y: number; width: number; height: number };
  printSize: string;
  onImageReposition?: (x: number, y: number) => void;
}

export function PreviewCanvas({
  garmentColor,
  uploadedImageUrl,
  placementCoordinates,
  printSize,
  onImageReposition,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const canvasWidth = 300;
  const canvasHeight = 400;

  // Draw the garment and design on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = garmentColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw garment outline (simple t-shirt shape)
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 40, 240, 280);

    // Draw placement area
    if (placementCoordinates) {
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        placementCoordinates.x,
        placementCoordinates.y,
        placementCoordinates.width,
        placementCoordinates.height
      );
      ctx.setLineDash([]);
    }

    // Draw uploaded image if available
    if (uploadedImageUrl) {
      const img = new Image();
      img.onload = () => {
        if (placementCoordinates) {
          ctx.drawImage(
            img,
            placementCoordinates.x + imagePosition.x,
            placementCoordinates.y + imagePosition.y,
            placementCoordinates.width,
            placementCoordinates.height
          );
        }
      };
      img.src = uploadedImageUrl;
    }
  }, [garmentColor, uploadedImageUrl, placementCoordinates, imagePosition]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!placementCoordinates) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (
      x >= placementCoordinates.x &&
      x <= placementCoordinates.x + placementCoordinates.width &&
      y >= placementCoordinates.y &&
      y <= placementCoordinates.y + placementCoordinates.height
    ) {
      setIsDragging(true);
      setDragOffset({
        x: x - imagePosition.x,
        y: y - imagePosition.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !placementCoordinates) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let newX = x - dragOffset.x;
    let newY = y - dragOffset.y;

    // Constrain within placement bounds
    newX = Math.max(-placementCoordinates.width / 2, Math.min(placementCoordinates.width / 2, newX));
    newY = Math.max(-placementCoordinates.height / 2, Math.min(placementCoordinates.height / 2, newY));

    setImagePosition({ x: newX, y: newY });
    onImageReposition?.(newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-move"
        />
      </div>
      <div className="text-sm text-gray-600 text-center">
        <p>Drag the design to reposition it within the placement area</p>
        <p className="text-xs mt-1">Print Size: {printSize}</p>
      </div>
    </div>
  );
}
