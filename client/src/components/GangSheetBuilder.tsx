import { useState, useRef, useEffect } from 'react';
import { Canvas, Image as FabricImage } from 'fabric';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Download, Send, ZoomIn, ZoomOut, RotateCw, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

const CANVAS_WIDTH_MM = 300;
const CANVAS_HEIGHT_MM = 1000;
const CANVAS_WIDTH_PX = 900;
const CANVAS_HEIGHT_PX = 3000;
const MM_TO_PX = CANVAS_WIDTH_PX / CANVAS_WIDTH_MM;

interface ArtworkItem {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
}

export function GangSheetBuilder({ gangSheetId }: { gangSheetId: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [artwork, setArtwork] = useState<ArtworkItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [removingBg, setRemovingBg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const removeBackgroundMutation = trpc.gangSheets.removeBackground.useMutation();

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: CANVAS_WIDTH_PX,
      height: CANVAS_HEIGHT_PX,
      backgroundColor: '#ffffff',
    });

    fabricCanvasRef.current = fabricCanvas;

    // Draw grid
    const ctx = fabricCanvas.getContext();
    const gridSize = 50 * MM_TO_PX; // 50mm grid
    for (let i = 0; i <= CANVAS_WIDTH_PX; i += gridSize) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT_PX);
      ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_HEIGHT_PX; i += gridSize) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH_PX, i);
      ctx.stroke();
    }

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 25MB limit`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const imgData = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const id = `artwork-${Date.now()}`;
          const newArtwork: ArtworkItem = {
            id,
            name: file.name,
            url: imgData,
            width: 100,
            height: (100 * img.height) / img.width,
            x: 50,
            y: 50,
            rotation: 0,
          };
          setArtwork([...artwork, newArtwork]);
          addToCanvas(newArtwork);
        };
        img.src = imgData;
      };
      reader.readAsDataURL(file);
    }
  };

  const addToCanvas = (item: ArtworkItem) => {
    if (!fabricCanvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const fabricImg = new FabricImage(img, {
        left: item.x * MM_TO_PX,
        top: item.y * MM_TO_PX,
        scaleX: (item.width * MM_TO_PX) / img.width,
        scaleY: (item.height * MM_TO_PX) / img.height,
        angle: item.rotation,
      });

      fabricImg.set({ id: item.id });
      fabricCanvasRef.current!.add(fabricImg);
      fabricCanvasRef.current!.renderAll();
    };
    img.src = item.url;
  };

  const handleDelete = (id: string) => {
    setArtwork(artwork.filter((a) => a.id !== id));
    if (fabricCanvasRef.current) {
      const obj = fabricCanvasRef.current.getObjects().find((o) => (o as any).id === id);
      if (obj) {
        fabricCanvasRef.current.remove(obj);
        fabricCanvasRef.current.renderAll();
      }
    }
  };

  const handleExport = async () => {
    if (!fabricCanvasRef.current) return;

    try {
      const dataUrl = fabricCanvasRef.current.toDataURL({ format: 'png', multiplier: 1 });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `gang-sheet-${gangSheetId}.png`;
      link.click();
      toast.success('Gang sheet exported as PNG');
    } catch (error) {
      toast.error('Failed to export gang sheet');
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' ? zoom + 0.1 : Math.max(0.1, zoom - 0.1);
    setZoom(newZoom);
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setZoom(newZoom);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleRemoveBackground = async (id: string) => {
    const item = artwork.find((a) => a.id === id);
    if (!item) return;

    setRemovingBg(id);
    try {
      const result = await removeBackgroundMutation.mutateAsync({ imageUrl: item.url });
      const updatedArtwork = artwork.map((a) =>
        a.id === id ? { ...a, url: result.imageUrl } : a
      );
      setArtwork(updatedArtwork);
      toast.success('Background removed successfully');
    } catch (error) {
      toast.error('Failed to remove background');
    } finally {
      setRemovingBg(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Artwork
        </Button>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export PNG
        </Button>
        <Button onClick={() => handleZoom('in')} variant="outline" className="gap-2">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button onClick={() => handleZoom('out')} variant="outline" className="gap-2">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Badge variant="secondary">Zoom: {(zoom * 100).toFixed(0)}%</Badge>
      </div>

      {/* Canvas */}
      <Card>
        <CardContent className="p-4 overflow-auto bg-gray-50" style={{ maxHeight: '600px' }}>
          <canvas ref={canvasRef} className="border-2 border-gray-300 mx-auto" />
        </CardContent>
      </Card>

      {/* Artwork Library */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Artwork Library ({artwork.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {artwork.length === 0 ? (
              <p className="text-gray-300 text-sm">No artwork added yet. Click "Add Artwork" to get started.</p>
            ) : (
              artwork.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-300">
                      {item.width.toFixed(1)}mm × {item.height.toFixed(1)}mm @ {item.rotation.toFixed(0)}°
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleRemoveBackground(item.id)}
                      variant="ghost"
                      size="sm"
                      disabled={removingBg === item.id}
                      className="text-blue-600 hover:text-blue-700"
                      title="Remove background"
                    >
                      <Wand2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(item.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
