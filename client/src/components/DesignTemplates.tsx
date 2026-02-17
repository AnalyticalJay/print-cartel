import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Square, Maximize2, CornerDownRight } from "lucide-react";

export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  config: {
    position: { x: number; y: number };
    scale: number;
    rotation: number;
  };
}

interface DesignTemplatesProps {
  selectedPlacement: string | null;
  onApplyTemplate: (template: DesignTemplate) => void;
}

export function DesignTemplates({
  selectedPlacement,
  onApplyTemplate,
}: DesignTemplatesProps) {
  // Define preset templates with positioning parameters
  const templates: DesignTemplate[] = [
    {
      id: "centered",
      name: "Centered",
      description: "Design centered in placement area",
      icon: <Square className="w-5 h-5" />,
      config: {
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
      },
    },
    {
      id: "top-left",
      name: "Top Left",
      description: "Design positioned in top-left corner",
      icon: <CornerDownRight className="w-5 h-5" />,
      config: {
        position: { x: -60, y: -60 },
        scale: 0.8,
        rotation: 0,
      },
    },
    {
      id: "top-right",
      name: "Top Right",
      description: "Design positioned in top-right corner",
      icon: <CornerDownRight className="w-5 h-5 rotate-90" />,
      config: {
        position: { x: 60, y: -60 },
        scale: 0.8,
        rotation: 0,
      },
    },
    {
      id: "bottom-left",
      name: "Bottom Left",
      description: "Design positioned in bottom-left corner",
      icon: <CornerDownRight className="w-5 h-5 -rotate-90" />,
      config: {
        position: { x: -60, y: 60 },
        scale: 0.8,
        rotation: 0,
      },
    },
    {
      id: "bottom-right",
      name: "Bottom Right",
      description: "Design positioned in bottom-right corner",
      icon: <CornerDownRight className="w-5 h-5 rotate-180" />,
      config: {
        position: { x: 60, y: 60 },
        scale: 0.8,
        rotation: 0,
      },
    },
    {
      id: "full-bleed",
      name: "Full Bleed",
      description: "Design scaled to fill entire placement area",
      icon: <Maximize2 className="w-5 h-5" />,
      config: {
        position: { x: 0, y: 0 },
        scale: 1.4,
        rotation: 0,
      },
    },
    {
      id: "small-centered",
      name: "Small Centered",
      description: "Small design centered in placement area",
      icon: <Copy className="w-5 h-5" />,
      config: {
        position: { x: 0, y: 0 },
        scale: 0.6,
        rotation: 0,
      },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Quick Templates</h3>
        {selectedPlacement && (
          <span className="text-xs text-gray-400">
            {selectedPlacement.toUpperCase()}
          </span>
        )}
      </div>

      {!selectedPlacement ? (
        <Card className="bg-gray-700 border-gray-600 p-3">
          <p className="text-sm text-gray-300">
            Select a placement area on the preview to apply templates
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {templates.map((template) => (
            <Button
              key={template.id}
              onClick={() => onApplyTemplate(template)}
              variant="outline"
              className="h-auto flex flex-col items-center justify-center py-3 px-2 bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-yellow-400"
              title={template.description}
            >
              <div className="mb-1 text-yellow-400">{template.icon}</div>
              <span className="text-xs text-white text-center">
                {template.name}
              </span>
            </Button>
          ))}
        </div>
      )}

      {selectedPlacement && (
        <div className="bg-blue-900 border border-blue-700 p-2 rounded-lg">
          <p className="text-xs text-blue-200">
            💡 Click a template to instantly position your design. You can still
            manually adjust it afterward.
          </p>
        </div>
      )}
    </div>
  );
}
