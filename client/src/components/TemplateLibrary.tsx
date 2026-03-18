import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Heart, Download } from "lucide-react";
import { toast } from "sonner";

interface TemplateLibraryProps {
  onTemplateSelect?: (template: any) => void;
  showActions?: boolean;
}

export function TemplateLibrary({ onTemplateSelect, showActions = true }: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // Fetch all templates
  const templatesQuery = trpc.templates.getAll.useQuery();

  // Fetch categories
  const categoriesQuery = trpc.templates.getCategories.useQuery();

  // Fetch popular templates
  const popularQuery = trpc.templates.getPopular.useQuery({ limit: 6 });

  // Track template usage mutation
  const trackUsageMutation = trpc.templates.trackUsage.useMutation();

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    if (!templatesQuery.data) return [];

    let filtered = templatesQuery.data;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [templatesQuery.data, selectedCategory, searchQuery]);

  const handleSelectTemplate = async (template: any) => {
    try {
      // Track usage
      await trackUsageMutation.mutateAsync({ templateId: template.id });
      
      if (onTemplateSelect) {
        onTemplateSelect(template);
      }
      toast.success(`Template "${template.name}" selected!`);
    } catch (error) {
      toast.error("Failed to select template");
    }
  };

  const toggleFavorite = (templateId: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(templateId)) {
      newFavorites.delete(templateId);
    } else {
      newFavorites.add(templateId);
    }
    setFavorites(newFavorites);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Design Templates</h2>
        <p className="text-gray-600">Choose from our collection of pre-made designs and customize them for your brand</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search templates by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs for Popular and All Templates */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="favorites">Favorites ({favorites.size})</TabsTrigger>
        </TabsList>

        {/* Popular Templates Tab */}
        <TabsContent value="popular" className="space-y-4">
          {popularQuery.isLoading ? (
            <div className="text-center py-8">Loading popular templates...</div>
          ) : popularQuery.data && popularQuery.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularQuery.data.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isFavorite={favorites.has(template.id)}
                  onSelect={handleSelectTemplate}
                  onToggleFavorite={toggleFavorite}
                  showActions={showActions}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-300">No popular templates yet</div>
          )}
        </TabsContent>

        {/* All Templates Tab with Category Filter */}
        <TabsContent value="all" className="space-y-4">
          {/* Category Filter */}
          {categoriesQuery.data && categoriesQuery.data.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                size="sm"
              >
                All Categories
              </Button>
              {categoriesQuery.data.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          )}

          {/* Templates Grid */}
          {templatesQuery.isLoading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isFavorite={favorites.has(template.id)}
                  onSelect={handleSelectTemplate}
                  onToggleFavorite={toggleFavorite}
                  showActions={showActions}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-300">
              No templates found matching your search
            </div>
          )}
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="space-y-4">
          {templatesQuery.data && templatesQuery.data.filter((t) => favorites.has(t.id)).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templatesQuery.data
                .filter((t) => favorites.has(t.id))
                .map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isFavorite={true}
                    onSelect={handleSelectTemplate}
                    onToggleFavorite={toggleFavorite}
                    showActions={showActions}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-300">
              No favorite templates yet. Click the heart icon to add templates to your favorites
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TemplateCardProps {
  template: any;
  isFavorite: boolean;
  onSelect: (template: any) => void;
  onToggleFavorite: (templateId: number) => void;
  showActions?: boolean;
}

function TemplateCard({
  template,
  isFavorite,
  onSelect,
  onToggleFavorite,
  showActions = true,
}: TemplateCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Template Preview Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={template.templateImageUrl}
          alt={template.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
        />
        {template.isPopular && (
          <Badge className="absolute top-2 right-2 bg-orange-500">Popular</Badge>
        )}
        {showActions && (
          <button
            onClick={() => onToggleFavorite(template.id)}
            className="absolute top-2 left-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`}
            />
          </button>
        )}
      </div>

      {/* Template Info */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription className="text-xs mt-1">
              <Badge variant="outline">{template.category}</Badge>
            </CardDescription>
          </div>
        </div>
        {template.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{template.description}</p>
        )}
      </CardHeader>

      {/* Usage Stats */}
      <CardContent className="pb-3">
        <div className="flex items-center justify-between text-xs text-gray-300 mb-3">
          <span>{template.usageCount || 0} people used this</span>
        </div>

        {/* Actions */}
        {showActions && (
          <Button
            onClick={() => onSelect(template)}
            className="w-full"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Use Template
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
