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
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { 
  FileText, 
  Download, 
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  Truck,
  AlertTriangle,
  Calendar,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Sale {
  id: number;
  productId: number;
  quantitySold: number;
  totalAmount: string;
  timestamp: string;
}

interface Product {
  id: number;
  name: string;
  productCode: string;
  stockQuantity: number;
  price: string;
  subCategoryId: number;
}

interface Purchase {
  id: number;
  productId: number;
  quantityReceived: number;
  totalCost: string;
  timestamp: string;
}

interface SubCategory {
  id: number;
  name: string;
  mainCategoryId: number;
}

interface MainCategory {
  id: number;
  name: string;
}

export default function Reports() {
  const { user } = useAuth();

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: subCategories = [] } = useQuery<SubCategory[]>({
    queryKey: ["/api/categories/sub"],
  });

  const { data: mainCategories = [] } = useQuery<MainCategory[]>({
    queryKey: ["/api/categories/main"],
  });

  // Only show to admins
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 pt-16 p-6">
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
                <p className="text-gray-600">Only administrators can access reports.</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  // Calculate weekly data (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklySales = sales.filter(sale => new Date(sale.timestamp) >= weekAgo);
  const weeklyPurchases = purchases.filter(purchase => new Date(purchase.timestamp) >= weekAgo);

  // Sales by category
  const salesByCategory = mainCategories.map(mainCat => {
    const subCats = subCategories.filter(sub => sub.mainCategoryId === mainCat.id);
    const categoryProducts = products.filter(product => 
      subCats.some(sub => sub.id === product.subCategoryId)
    );
    
    const categorySales = weeklySales.filter(sale => 
      categoryProducts.some(product => product.id === sale.productId)
    );
    
    const totalAmount = categorySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalQuantity = categorySales.reduce((sum, sale) => sum + sale.quantitySold, 0);
    
    return {
      category: mainCat.name,
      amount: totalAmount,
      quantity: totalQuantity,
      sales: categorySales.length,
    };
  }).filter(cat => cat.sales > 0);

  // Top selling products
  const productSalesMap = new Map();
  weeklySales.forEach(sale => {
    const existing = productSalesMap.get(sale.productId) || { quantity: 0, amount: 0, sales: 0 };
    productSalesMap.set(sale.productId, {
      quantity: existing.quantity + sale.quantitySold,
      amount: existing.amount + Number(sale.totalAmount),
      sales: existing.sales + 1,
    });
  });

  const topProducts = Array.from(productSalesMap.entries())
    .map(([productId, data]) => {
      const product = products.find(p => p.id === Number(productId));
      return {
        product,
        ...data,
      };
    })
    .filter(item => item.product)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Low stock products
  const lowStockProducts = products.filter(product => 
    product.stockQuantity <= 5 // Using 5 as default threshold
  );

  // Weekly summary stats
  const weeklyRevenue = weeklySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const weeklyPurchaseCost = weeklyPurchases.reduce((sum, purchase) => sum + Number(purchase.totalCost), 0);
  const totalInventoryValue = products.reduce((sum, product) => 
    sum + (Number(product.price) * product.stockQuantity), 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 pt-16 p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600">Comprehensive business insights and analytics</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" className="text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                Last 7 Days
              </Button>
              <Button variant="outline" className="text-gray-600">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Weekly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(weeklyRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Truck className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Purchase Costs</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(weeklyPurchaseCost)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInventoryValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Low Stock Alert</p>
                    <p className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sales by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Sales by Category (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesByCategory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No sales data for the last 7 days
                  </div>
                ) : (
                  <div className="space-y-4">
                    {salesByCategory.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{category.category}</p>
                          <p className="text-sm text-gray-500">
                            {category.sales} sales • {category.quantity} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatCurrency(category.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Selling Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Top Selling Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No sales data available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.product?.name}</p>
                            <p className="text-sm text-gray-500">{item.product?.productCode}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{item.quantity} sold</p>
                          <p className="text-sm text-green-600">{formatCurrency(item.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Low Stock Alert
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {lowStockProducts.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  All products are well stocked
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Value at Risk</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-500">{product.productCode}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`font-medium ${product.stockQuantity <= 2 ? 'text-red-600' : 'text-orange-600'}`}>
                              {product.stockQuantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {formatCurrency(Number(product.price) * product.stockQuantity)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={product.stockQuantity <= 2 ? "destructive" : "secondary"}
                              className={product.stockQuantity <= 2 ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}
                            >
                              {product.stockQuantity <= 2 ? "Critical" : "Low"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
