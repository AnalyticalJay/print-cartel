import { useEffect, useRef, useState } from "react";

interface PreviewCanvasProps {
  garmentColor: string;
  uploadedImageUrl?: string;
  placementCoordinates?: { x: number; y: number; width: number; height: number };
  printSize: string;
  onImageReposition?: (x: number, y: number) => void;
  onRotationChange?: (rotation: number) => void;
}

export function PreviewCanvas({
  garmentColor,
  uploadedImageUrl,
  placementCoordinates,
  printSize,
  onImageReposition,
  onRotationChange,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

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
          // Save context state
          ctx.save();
          
          // Translate to center of placement area, rotate, then translate back
          const centerX = placementCoordinates.x + placementCoordinates.width / 2 + imagePosition.x;
          const centerY = placementCoordinates.y + placementCoordinates.height / 2 + imagePosition.y;
          
          ctx.translate(centerX, centerY);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);
          
          ctx.drawImage(
            img,
            placementCoordinates.x + imagePosition.x,
            placementCoordinates.y + imagePosition.y,
            placementCoordinates.width,
            placementCoordinates.height
          );
          
          // Restore context state
          ctx.restore();
        }
      };
      img.src = uploadedImageUrl;
    }
  }, [garmentColor, uploadedImageUrl, placementCoordinates, imagePosition, rotation]);

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

  const handleRotation = (angle: number) => {
    setRotation(angle);
    onRotationChange?.(angle);
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
      
      {/* Rotation Controls */}
      <div className="flex gap-2 items-center flex-wrap justify-center">
        <span className="text-sm font-semibold text-gray-700">Rotate:</span>
        {[0, 90, 180, 270].map((angle) => (
          <button
            key={angle}
            onClick={() => handleRotation(angle)}
            className={`px-3 py-2 rounded font-semibold text-sm transition-colors ${
              rotation === angle
                ? "bg-accent text-accent-foreground"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {angle}°
          </button>
        ))}
      </div>
      
      <div className="text-sm text-gray-600 text-center">
        <p>Drag the design to reposition it within the placement area</p>
        <p className="text-xs mt-1">Print Size: {printSize}</p>
      </div>
    </div>
  );
}
