import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecordSaleModal } from "@/components/modals/record-sale-modal";
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  TrendingUp,
  Package,
  DollarSign
} from "lucide-react";

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
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

export default function Sales() {
  const [showRecordSale, setShowRecordSale] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getProductInfo = (productId: number) => {
    return products.find(product => product.id === productId);
  };

  const filteredSales = sales.filter(sale => {
    const product = getProductInfo(sale.productId);
    return product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           product?.productCode.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate stats
  const todaysSales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantitySold, 0);

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600">Track and manage all sales transactions</p>
        </div>
        <Button onClick={() => setShowRecordSale(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Record Sale
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(todaysRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Items Sold</p>
                <p className="text-2xl font-bold text-gray-900">{totalItemsSold}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sales History</CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search sales..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading sales...</div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? "No sales found matching your search" : "No sales recorded yet. Record your first sale to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Sold By</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => {
                    const product = getProductInfo(sale.productId);
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              {product?.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {product?.name || "Unknown Product"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {product?.productCode || "N/A"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{sale.quantitySold}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(sale.salePrice)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-green-600">
                            {formatCurrency(sale.totalAmount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {sale.soldBy}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatDateTime(sale.timestamp)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Completed
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

      {/* Record Sale Modal */}
      <RecordSaleModal 
        open={showRecordSale} 
        onOpenChange={setShowRecordSale} 
      />
    </div>
  );
}
