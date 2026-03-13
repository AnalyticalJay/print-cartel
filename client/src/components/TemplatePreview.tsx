import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

interface TemplatePreviewProps {
  templateId: number;
  onBack: () => void;
  onUseTemplate?: (customizations: Record<string, any>) => void;
}

export function TemplatePreview({ templateId, onBack, onUseTemplate }: TemplatePreviewProps) {
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch template details with customization options
  const templateQuery = trpc.templates.getById.useQuery({ templateId });

  // Initialize customizations with default values
  useEffect(() => {
    if (templateQuery.data?.customizations) {
      const initialCustomizations: Record<string, any> = {};
      templateQuery.data.customizations.forEach((custom: any) => {
        initialCustomizations[custom.label] = custom.defaultValue || "";
      });
      setCustomizations(initialCustomizations);
    }
  }, [templateQuery.data]);

  const handleCustomizationChange = (label: string, value: string) => {
    setCustomizations((prev) => ({
      ...prev,
      [label]: value,
    }));
  };

  const handleUseTemplate = async () => {
    try {
      setIsLoading(true);
      if (onUseTemplate) {
        onUseTemplate(customizations);
      }
      toast.success("Template applied! Proceeding to order wizard...");
    } catch (error) {
      toast.error("Failed to apply template");
    } finally {
      setIsLoading(false);
    }
  };

  if (templateQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading template...</p>
      </div>
    );
  }

  if (!templateQuery.data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Template not found</p>
      </div>
    );
  }

  const template = templateQuery.data;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{template.name}</h2>
          <p className="text-sm text-gray-600">{template.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={template.templateImageUrl}
                  alt={template.name}
                  className="w-full h-auto"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customization Options */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customize</CardTitle>
              <CardDescription>Personalize this template for your brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Badge */}
              <div>
                <Label className="text-xs text-gray-600">Category</Label>
                <Badge variant="outline" className="mt-1">
                  {template.category}
                </Badge>
              </div>

              {/* Customization Fields */}
              {template.customizations && template.customizations.length > 0 ? (
                <div className="space-y-3">
                  {template.customizations.map((custom: any) => (
                    <div key={custom.id}>
                      <Label htmlFor={custom.label} className="text-sm">
                        {custom.label}
                      </Label>

                      {custom.customizationType === "color" ? (
                        <div className="flex gap-2 mt-1">
                          <Input
                            id={custom.label}
                            type="color"
                            value={customizations[custom.label] || custom.defaultValue || "#000000"}
                            onChange={(e) => handleCustomizationChange(custom.label, e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={customizations[custom.label] || custom.defaultValue || ""}
                            onChange={(e) => handleCustomizationChange(custom.label, e.target.value)}
                            placeholder="Color value"
                            className="flex-1 text-xs"
                          />
                        </div>
                      ) : custom.customizationType === "size" ? (
                        <Select
                          value={customizations[custom.label] || custom.defaultValue || ""}
                          onValueChange={(value) => handleCustomizationChange(custom.label, value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            {custom.allowedValues &&
                              Array.isArray(custom.allowedValues) &&
                              custom.allowedValues.map((value: string) => (
                                <SelectItem key={value} value={value}>
                                  {value}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={custom.label}
                          type="text"
                          value={customizations[custom.label] || custom.defaultValue || ""}
                          onChange={(e) => handleCustomizationChange(custom.label, e.target.value)}
                          placeholder={custom.label}
                          className="mt-1 text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No customization options available</p>
              )}

              {/* Template Info */}
              <div className="pt-4 border-t space-y-2">
                <div className="text-xs">
                  <span className="text-gray-600">Used by: </span>
                  <span className="font-semibold">{template.usageCount || 0} customers</span>
                </div>
                {template.isPopular && (
                  <Badge className="bg-orange-500 w-full justify-center">Popular Choice</Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Button
                  onClick={handleUseTemplate}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isLoading ? "Applying..." : "Use This Template"}
                </Button>
                <Button variant="outline" onClick={onBack} className="w-full">
                  Choose Different Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Template Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Template Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {template.defaultProductId && (
              <div>
                <p className="text-xs text-gray-600">Suggested Product</p>
                <p className="font-semibold">Product ID: {template.defaultProductId}</p>
              </div>
            )}
            {template.defaultColorId && (
              <div>
                <p className="text-xs text-gray-600">Suggested Color</p>
                <p className="font-semibold">Color ID: {template.defaultColorId}</p>
              </div>
            )}
            {template.defaultPlacements && (
              <div>
                <p className="text-xs text-gray-600">Placements</p>
                <p className="font-semibold">{Array.isArray(template.defaultPlacements) ? template.defaultPlacements.length : 0} options</p>
              </div>
            )}
            {template.defaultPrintSizes && (
              <div>
                <p className="text-xs text-gray-600">Print Sizes</p>
                <p className="font-semibold">{Array.isArray(template.defaultPrintSizes) ? template.defaultPrintSizes.length : 0} options</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
