import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Image as ImageIcon, Package } from "lucide-react";

interface Design {
  id: number;
  uploadedFileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl: string;
}

interface QuantityDesigns {
  quantityNumber: number;
  designs: Design[];
}

interface PlacementDesigns {
  placementId: number;
  placementName: string;
  designsByQuantity: QuantityDesigns[];
}

interface AdvancedOrderDetailViewProps {
  order: {
    id: number;
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string;
    customerPhone: string;
    quantity: number;
    totalPriceEstimate: string;
    status: string;
    additionalNotes?: string;
  };
  designsByPlacement: PlacementDesigns[];
  quantities: Array<{ id: number; quantityNumber: number }>;
  variation?: {
    sameDesignForAll: boolean;
  };
}

export function AdvancedOrderDetailView({
  order,
  designsByPlacement,
  quantities,
  variation,
}: AdvancedOrderDetailViewProps) {
  const [expandedPlacement, setExpandedPlacement] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      quoted: "bg-blue-100 text-blue-800",
      approved: "bg-purple-100 text-purple-800",
      "in-production": "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      shipped: "bg-teal-100 text-teal-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Order #{order.id}</CardTitle>
              <CardDescription>
                {order.customerFirstName} {order.customerLastName}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace("-", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-white">{order.customerEmail}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-white">{order.customerPhone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Quantity</p>
              <p className="font-medium text-white">{order.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Price</p>
              <p className="font-medium text-white">R {order.totalPriceEstimate}</p>
            </div>
          </div>

          {variation && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <p className="font-medium">
                Design Configuration: {variation.sameDesignForAll ? "Same Design for All Quantities" : "Different Designs per Quantity"}
              </p>
            </div>
          )}

          {order.additionalNotes && (
            <div>
              <p className="text-sm text-gray-500">Special Notes</p>
              <p className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
                {order.additionalNotes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Designs by Placement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Designs by Placement
          </CardTitle>
          <CardDescription>
            {designsByPlacement.length} placement area{designsByPlacement.length !== 1 ? "s" : ""} with designs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={`placement-${designsByPlacement[0]?.placementId}`} className="w-full">
            <TabsList className="grid w-full gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(120px, 1fr))` }}>
              {designsByPlacement.map((placement) => (
                <TabsTrigger key={placement.placementId} value={`placement-${placement.placementId}`}>
                  {placement.placementName}
                </TabsTrigger>
              ))}
            </TabsList>

            {designsByPlacement.map((placement) => (
              <TabsContent key={placement.placementId} value={`placement-${placement.placementId}`} className="space-y-4">
                <div className="space-y-4">
                  {placement.designsByQuantity.map((quantityDesigns) => (
                    <div key={quantityDesigns.quantityNumber} className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="font-medium text-white">
                          Quantity {quantityDesigns.quantityNumber}
                          {quantityDesigns.quantityNumber === 1 ? " (First Item)" : ""}
                        </h4>
                        <Badge variant="outline">{quantityDesigns.designs.length} design(s)</Badge>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {quantityDesigns.designs.map((design) => (
                          <DesignThumbnailCard key={design.id} design={design} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface DesignThumbnailCardProps {
  design: Design;
}

function DesignThumbnailCard({ design }: DesignThumbnailCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      {/* Thumbnail */}
      <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-white">
        {!imageError && design.thumbnailUrl ? (
          <img
            src={design.thumbnailUrl}
            alt={design.uploadedFileName}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="space-y-2">
        <p className="truncate text-xs font-medium text-gray-900" title={design.uploadedFileName}>
          {design.uploadedFileName}
        </p>
        <p className="text-xs text-gray-600">{formatFileSize(design.fileSize)}</p>

        {/* Download Button */}
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => {
            // In a real implementation, this would trigger a download
            // For now, we'll open the URL in a new tab
            if (design.thumbnailUrl) {
              window.open(design.thumbnailUrl, "_blank");
            }
          }}
        >
          <Download className="mr-1 h-3 w-3" />
          Download
        </Button>
      </div>
    </div>
  );
}
