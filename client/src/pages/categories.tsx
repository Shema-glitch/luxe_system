import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddCategoryModal } from "@/components/modals/add-category-modal";
import { 
  Tags, 
  Plus, 
  FolderOpen,
  Package
} from "lucide-react";

interface MainCategory {
  id: number;
  name: string;
  createdAt: string;
}

interface SubCategory {
  id: number;
  name: string;
  mainCategoryId: number;
  createdAt: string;
}

interface Product {
  id: number;
  subCategoryId: number;
}

export default function Categories() {
  const [showAddCategory, setShowAddCategory] = useState(false);

  const { data: mainCategories = [], isLoading: loadingMain } = useQuery<MainCategory[]>({
    queryKey: ["/api/categories/main"],
  });

  const { data: subCategories = [], isLoading: loadingSub } = useQuery<SubCategory[]>({
    queryKey: ["/api/categories/sub"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const getSubCategoriesForMain = (mainCategoryId: number) => {
    return subCategories.filter(sub => sub.mainCategoryId === mainCategoryId);
  };

  const getProductCountForSubCategory = (subCategoryId: number) => {
    return products.filter(product => product.subCategoryId === subCategoryId).length;
  };

  const getProductCountForMainCategory = (mainCategoryId: number) => {
    const subCats = getSubCategoriesForMain(mainCategoryId);
    return subCats.reduce((total, subCat) => total + getProductCountForSubCategory(subCat.id), 0);
  };

  const isLoading = loadingMain || loadingSub;

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Organize your products with categories and sub-categories</p>
        </div>
        <Button onClick={() => setShowAddCategory(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FolderOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Main Categories</p>
                <p className="text-2xl font-bold text-gray-900">{mainCategories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Tags className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sub-Categories</p>
                <p className="text-2xl font-bold text-gray-900">{subCategories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FolderOpen className="h-5 w-5 mr-2" />
              Main Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading categories...</div>
            ) : mainCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No main categories found. Add your first category to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Sub-Categories</TableHead>
                      <TableHead>Products</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mainCategories.map((category) => {
                      const subCatCount = getSubCategoriesForMain(category.id).length;
                      const productCount = getProductCountForMainCategory(category.id);
                      
                      return (
                        <TableRow key={category.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{category.name}</p>
                              <p className="text-sm text-gray-500">
                                Created {new Date(category.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {subCatCount} sub-categories
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {productCount} products
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sub-Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tags className="h-5 w-5 mr-2" />
              Sub-Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading sub-categories...</div>
            ) : subCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sub-categories found. Add your first sub-category to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Main Category</TableHead>
                      <TableHead>Products</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subCategories.map((subCategory) => {
                      const mainCategory = mainCategories.find(main => main.id === subCategory.mainCategoryId);
                      const productCount = getProductCountForSubCategory(subCategory.id);
                      
                      return (
                        <TableRow key={subCategory.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{subCategory.name}</p>
                              <p className="text-sm text-gray-500">
                                Created {new Date(subCategory.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {mainCategory?.name || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {productCount} products
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Hierarchy */}
      {mainCategories.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Category Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mainCategories.map((mainCategory) => {
                const subCats = getSubCategoriesForMain(mainCategory.id);
                const productCount = getProductCountForMainCategory(mainCategory.id);
                
                return (
                  <div key={mainCategory.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FolderOpen className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="font-semibold text-gray-900">{mainCategory.name}</h3>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {productCount} products
                      </Badge>
                    </div>
                    
                    {subCats.length > 0 ? (
                      <div className="ml-7 space-y-2">
                        {subCats.map((subCategory) => {
                          const subProductCount = getProductCountForSubCategory(subCategory.id);
                          return (
                            <div key={subCategory.id} className="flex items-center justify-between py-2 border-l-2 border-gray-200 pl-4">
                              <div className="flex items-center">
                                <Tags className="h-4 w-4 text-green-600 mr-2" />
                                <span className="text-gray-700">{subCategory.name}</span>
                              </div>
                              <Badge variant="outline">
                                {subProductCount} products
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="ml-7 text-sm text-gray-500">
                        No sub-categories yet
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Category Modal */}
      <AddCategoryModal 
        open={showAddCategory} 
        onOpenChange={setShowAddCategory} 
      />
    </div>
  );
}
