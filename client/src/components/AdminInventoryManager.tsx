import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
interface Product {
  id: number;
  name: string;
  basePrice: number | string;
  description?: string | null;
  productType?: string | null;
  fabricType?: string | null;
}

interface PrintOption {
  id: number;
  printSize: string;
  additionalPrice: number | string;
}

interface PrintPlacement {
  id: number;
  placementName: string;
  positionCoordinates?: any;
}

export function AdminInventoryManager() {
  const [activeTab, setActiveTab] = useState("products");
  
  // Products state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: "", basePrice: 0, productType: "", fabricType: "", description: "" });

  // Print options state
  const [showOptionForm, setShowOptionForm] = useState(false);
  const [editingOption, setEditingOption] = useState<PrintOption | null>(null);
  const [optionForm, setOptionForm] = useState({ printSize: "", additionalPrice: 0 });

  // Print placements state
  const [showPlacementForm, setShowPlacementForm] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState<PrintPlacement | null>(null);
  const [placementForm, setPlacementForm] = useState({ placementName: "" });

  // Queries
  const productsQuery = trpc.admin.getAllProducts.useQuery();
  const optionsQuery = trpc.admin.getAllPrintOptions.useQuery();
  const placementsQuery = trpc.admin.getAllPrintPlacements.useQuery();

  // Mutations
  const createProductMutation = trpc.admin.createProduct.useMutation({
    onSuccess: () => {
      console.log("Product created successfully");
      productsQuery.refetch();
      setShowProductForm(false);
      setProductForm({ name: "", basePrice: 0, productType: "", fabricType: "", description: "" });
    },
    onError: (error) => {
      console.error("Error creating product:", error.message);
    },
  });

  const updateProductMutation = trpc.admin.updateProduct.useMutation({
    onSuccess: () => {
      console.log("Product updated successfully");
      productsQuery.refetch();
      setEditingProduct(null);
      setProductForm({ name: "", basePrice: 0, productType: "", fabricType: "", description: "" });
    },
    onError: (error) => {
      console.error("Error updating product:", error.message);
    },
  });

  const deleteProductMutation = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => {
      console.log("Product deleted successfully");
      productsQuery.refetch();
    },
    onError: (error) => {
      console.error("Error deleting product:", error.message);
    },
  });

  const createOptionMutation = trpc.admin.createPrintOption.useMutation({
    onSuccess: () => {
      console.log("Print option created successfully");
      optionsQuery.refetch();
      setShowOptionForm(false);
      setOptionForm({ printSize: "", additionalPrice: 0 });
    },
    onError: (error) => {
      console.error("Error creating print option:", error.message);
    },
  });

  const updateOptionMutation = trpc.admin.updatePrintOption.useMutation({
    onSuccess: () => {
      console.log("Print option updated successfully");
      optionsQuery.refetch();
      setEditingOption(null);
      setOptionForm({ printSize: "", additionalPrice: 0 });
    },
    onError: (error) => {
      console.error("Error updating print option:", error.message);
    },
  });

  const deleteOptionMutation = trpc.admin.deletePrintOption.useMutation({
    onSuccess: () => {
      console.log("Print option deleted successfully");
      optionsQuery.refetch();
    },
    onError: (error) => {
      console.error("Error deleting print option:", error.message);
    },
  });

  const createPlacementMutation = trpc.admin.createPrintPlacement.useMutation({
    onSuccess: () => {
      console.log("Print placement created successfully");
      placementsQuery.refetch();
      setShowPlacementForm(false);
      setPlacementForm({ placementName: "" });
    },
    onError: (error) => {
      console.error("Error creating print placement:", error.message);
    },
  });

  const updatePlacementMutation = trpc.admin.updatePrintPlacement.useMutation({
    onSuccess: () => {
      console.log("Print placement updated successfully");
      placementsQuery.refetch();
      setEditingPlacement(null);
      setPlacementForm({ placementName: "" });
    },
    onError: (error) => {
      console.error("Error updating print placement:", error.message);
    },
  });

  const deletePlacementMutation = trpc.admin.deletePrintPlacement.useMutation({
    onSuccess: () => {
      console.log("Print placement deleted successfully");
      placementsQuery.refetch();
    },
    onError: (error) => {
      console.error("Error deleting print placement:", error.message);
    },
  });

  // Product handlers
  const handleSaveProduct = () => {
    if (!productForm.name || productForm.basePrice <= 0) {
      console.error("Please fill in all required fields");
      return;
    }

    if (editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        name: productForm.name,
        basePrice: productForm.basePrice,
        productType: productForm.productType,
        fabricType: productForm.fabricType,
        description: productForm.description,
      });
    } else {
      createProductMutation.mutate({
        name: productForm.name,
        basePrice: productForm.basePrice,
        productType: productForm.productType,
        fabricType: productForm.fabricType,
        description: productForm.description,
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      basePrice: typeof product.basePrice === 'string' ? parseFloat(product.basePrice) : product.basePrice,
      productType: product.productType || "",
      fabricType: product.fabricType || "",
      description: product.description || "",
    });
    setShowProductForm(true);
  };

  // Option handlers
  const handleSaveOption = () => {
    if (!optionForm.printSize || optionForm.additionalPrice < 0) {
      console.error("Please fill in all required fields");
      return;
    }

    if (editingOption) {
      updateOptionMutation.mutate({
        id: editingOption.id,
        printSize: optionForm.printSize,
        additionalPrice: optionForm.additionalPrice,
      });
    } else {
      createOptionMutation.mutate({
        printSize: optionForm.printSize,
        additionalPrice: optionForm.additionalPrice,
      });
    }
  };

  const handleEditOption = (option: PrintOption) => {
    setEditingOption(option);
    setOptionForm({
      printSize: option.printSize,
      additionalPrice: typeof option.additionalPrice === 'string' ? parseFloat(option.additionalPrice) : option.additionalPrice,
    });
    setShowOptionForm(true);
  };

  // Placement handlers
  const handleSavePlacement = () => {
    if (!placementForm.placementName) {
      console.error("Please fill in all required fields");
      return;
    }

    if (editingPlacement) {
      updatePlacementMutation.mutate({
        id: editingPlacement.id,
        placementName: placementForm.placementName,
      });
    } else {
      createPlacementMutation.mutate({
        placementName: placementForm.placementName,
      });
    }
  };

  const handleEditPlacement = (placement: PrintPlacement) => {
    setEditingPlacement(placement);
    setPlacementForm({
      placementName: placement.placementName,
    });
    setShowPlacementForm(true);
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>Manage products, colors, sizes, and print placements</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="sizes">Sizes</TabsTrigger>
              <TabsTrigger value="placements">Placements</TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Products</h3>
                <Button onClick={() => {
                  setEditingProduct(null);
                  setProductForm({ name: "", basePrice: 0, productType: "", fabricType: "", description: "" });
                  setShowProductForm(!showProductForm);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>

              {showProductForm && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium">Product Name *</label>
                      <Input
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="e.g., T-Shirt"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Base Price *</label>
                      <Input
                        type="number"
                        value={productForm.basePrice}
                        onChange={(e) => setProductForm({ ...productForm, basePrice: parseFloat(e.target.value) })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Product Type</label>
                      <Input
                        value={productForm.productType}
                        onChange={(e) => setProductForm({ ...productForm, productType: e.target.value })}
                        placeholder="e.g., Apparel"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Fabric Type</label>
                      <Input
                        value={productForm.fabricType}
                        onChange={(e) => setProductForm({ ...productForm, fabricType: e.target.value })}
                        placeholder="e.g., Cotton"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        placeholder="Product description"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProduct} disabled={createProductMutation.isPending || updateProductMutation.isPending}>
                        {createProductMutation.isPending || updateProductMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        {editingProduct ? "Update" : "Create"} Product
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setShowProductForm(false);
                        setEditingProduct(null);
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {productsQuery.isLoading ? (
                  <p className="text-gray-300">Loading products...</p>
                ) : productsQuery.data?.length === 0 ? (
                  <p className="text-gray-300">No products yet</p>
                ) : (
                  productsQuery.data?.map((product) => (
                    <div key={product.id} className="flex justify-between items-center p-3 border rounded-lg bg-white">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">${typeof product.basePrice === 'string' ? parseFloat(product.basePrice) : product.basePrice} • {product.productType}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteProductMutation.mutate({ id: product.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Sizes Tab */}
            <TabsContent value="sizes" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Print Sizes</h3>
                <Button onClick={() => {
                  setEditingOption(null);
                  setOptionForm({ printSize: "", additionalPrice: 0 });
                  setShowOptionForm(!showOptionForm);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Size
                </Button>
              </div>

              {showOptionForm && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium">Print Size *</label>
                      <Input
                        value={optionForm.printSize}
                        onChange={(e) => setOptionForm({ ...optionForm, printSize: e.target.value })}
                        placeholder="e.g., A4"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Additional Price</label>
                      <Input
                        type="number"
                        value={optionForm.additionalPrice}
                        onChange={(e) => setOptionForm({ ...optionForm, additionalPrice: parseFloat(e.target.value) })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveOption} disabled={createOptionMutation.isPending || updateOptionMutation.isPending}>
                        {createOptionMutation.isPending || updateOptionMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        {editingOption ? "Update" : "Create"} Size
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setShowOptionForm(false);
                        setEditingOption(null);
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {optionsQuery.isLoading ? (
                  <p className="text-gray-300">Loading sizes...</p>
                ) : optionsQuery.data?.length === 0 ? (
                  <p className="text-gray-300">No sizes yet</p>
                ) : (
                  optionsQuery.data?.map((option) => (
                    <div key={option.id} className="flex justify-between items-center p-3 border rounded-lg bg-white">
                      <div>
                        <p className="font-medium">{option.printSize}</p>
                        <p className="text-sm text-gray-600">+${typeof option.additionalPrice === 'string' ? parseFloat(option.additionalPrice) : option.additionalPrice}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditOption(option)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteOptionMutation.mutate({ id: option.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Placements Tab */}
            <TabsContent value="placements" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Print Placements</h3>
                <Button onClick={() => {
                  setEditingPlacement(null);
                  setPlacementForm({ placementName: "" });
                  setShowPlacementForm(!showPlacementForm);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Placement
                </Button>
              </div>

              {showPlacementForm && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium">Placement Name *</label>
                      <Input
                        value={placementForm.placementName}
                        onChange={(e) => setPlacementForm({ ...placementForm, placementName: e.target.value })}
                        placeholder="e.g., Front Center"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSavePlacement} disabled={createPlacementMutation.isPending || updatePlacementMutation.isPending}>
                        {createPlacementMutation.isPending || updatePlacementMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        {editingPlacement ? "Update" : "Create"} Placement
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setShowPlacementForm(false);
                        setEditingPlacement(null);
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {placementsQuery.isLoading ? (
                  <p className="text-gray-300">Loading placements...</p>
                ) : placementsQuery.data?.length === 0 ? (
                  <p className="text-gray-300">No placements yet</p>
                ) : (
                  placementsQuery.data?.map((placement) => (
                    <div key={placement.id} className="flex justify-between items-center p-3 border rounded-lg bg-white">
                      <div>
                        <p className="font-medium">{placement.placementName}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditPlacement(placement)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deletePlacementMutation.mutate({ id: placement.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
