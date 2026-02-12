import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderMockupPreviewProps {
  designUrl: string;
  garmentColor: string;
  productName: string;
}

export function OrderMockupPreview({ designUrl, garmentColor, productName }: OrderMockupPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 400;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    // Draw garment background
    ctx.fillStyle = garmentColor || "#000000";
    ctx.fillRect(0, 0, width, height);

    // Draw garment shape (simple T-shirt silhouette)
    ctx.fillStyle = garmentColor || "#000000";
    
    // Body
    ctx.fillRect(50, 80, 300, 250);
    
    // Left sleeve
    ctx.fillRect(20, 100, 30, 150);
    
    // Right sleeve
    ctx.fillRect(350, 100, 30, 150);
    
    // Neckline
    ctx.beginPath();
    ctx.arc(200, 80, 30, 0, Math.PI * 2);
    ctx.fill();

    // Draw design placeholder or image
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(100, 150, 200, 150);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Design Preview", 200, 225);

    // Load and draw design image if available
    if (designUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Calculate dimensions to fit in preview area
        const maxWidth = 150;
        const maxHeight = 120;
        let imgWidth = img.width;
        let imgHeight = img.height;

        const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
        imgWidth *= ratio;
        imgHeight *= ratio;

        const x = (width - imgWidth) / 2;
        const y = 150 + (150 - imgHeight) / 2;

        ctx.drawImage(img, x, y, imgWidth, imgHeight);
      };
      img.onerror = () => {
        // Fallback if image fails to load
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(100, 150, 200, 150);
      };
      img.src = designUrl;
    }
  }, [designUrl, garmentColor]);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Order Preview</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="bg-black p-4 rounded-lg">
          <canvas
            ref={canvasRef}
            className="border border-gray-700 rounded"
          />
          <p className="text-center text-gray-400 mt-4 text-sm">{productName}</p>
        </div>
      </CardContent>
    </Card>
  );
}
