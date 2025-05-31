import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddProductModal } from "@/components/modals/add-product-modal";
import { RecordSaleModal } from "@/components/modals/record-sale-modal";
import { RecordPurchaseModal } from "@/components/modals/record-purchase-modal";
import { StockMovementModal } from "@/components/modals/stock-movement-modal";
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Wallet, 
  Plus, 
  ShoppingCart, 
  ArrowUpDown, 
  Truck 
} from "lucide-react";
import { useState } from "react";

interface DashboardStats {
  totalProducts: number;
  todaySales: number;
  lowStockCount: number;
  totalInventoryValue: number;
}

interface Sale {
  id: number;
  productId: number;
  quantitySold: number;
  salePrice: string;
  totalAmount: string;
  soldBy: string;
  timestamp: string;
}

interface Product {
  id: number;
  name: string;
  productCode: string;
  imageUrl?: string;
  stockQuantity: number;
  price: string;
}

export default function Dashboard() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showRecordSale, setShowRecordSale] = useState(false);
  const [showRecordPurchase, setShowRecordPurchase] = useState(false);
  const [showStockMovement, setShowStockMovement] = useState(false);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentSales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales/recent"],
  });

  const { data: lowStockProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/low-stock"],
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
          {/* Dashboard Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Products</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats?.totalProducts?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(stats?.todaySales || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {stats?.lowStockCount || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-orange-600 font-medium">Needs attention</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(stats?.totalInventoryValue || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-gray-500">inventory value</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Sales */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Recent Sales</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {recentSales.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No recent sales found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentSales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Product ID: {sale.productId}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {sale.quantitySold} × {formatCurrency(sale.salePrice)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(sale.totalAmount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(sale.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Low Stock Alerts</CardTitle>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {lowStockProducts.length} items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {lowStockProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    All products are well stocked
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lowStockProducts.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.name} ({product.productCode})
                          </p>
                          <p className="text-xs text-gray-500">
                            Price: {formatCurrency(product.price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={product.stockQuantity <= 2 ? "destructive" : "secondary"}
                            className={product.stockQuantity <= 2 ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}
                          >
                            {product.stockQuantity} left
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Section */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto border-gray-200 hover:bg-gray-50"
                  onClick={() => setShowAddProduct(true)}
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Add Product</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto border-gray-200 hover:bg-gray-50"
                  onClick={() => setShowRecordSale(true)}
                >
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                    <ShoppingCart className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Record Sale</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto border-gray-200 hover:bg-gray-50"
                  onClick={() => setShowStockMovement(true)}
                >
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
                    <ArrowUpDown className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Stock Movement</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto border-gray-200 hover:bg-gray-50"
                  onClick={() => setShowRecordPurchase(true)}
                >
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
                    <Truck className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Record Purchase</span>
                </Button>
              </div>
            </CardContent>
          </Card>

      {/* Modals */}
      <AddProductModal 
        open={showAddProduct} 
        onOpenChange={setShowAddProduct} 
      />
      <RecordSaleModal 
        open={showRecordSale} 
        onOpenChange={setShowRecordSale} 
      />
      <RecordPurchaseModal 
        open={showRecordPurchase} 
        onOpenChange={setShowRecordPurchase} 
      />
      <StockMovementModal 
        open={showStockMovement} 
        onOpenChange={setShowStockMovement} 
      />
    </div>
  );
}
