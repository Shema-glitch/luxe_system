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
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { RecordPurchaseModal } from "@/components/modals/record-purchase-modal";
import { 
  Truck, 
  Plus, 
  Search, 
  Package,
  DollarSign,
  TrendingUp,
  Building
} from "lucide-react";

interface Purchase {
  id: number;
  productId: number;
  quantityReceived: number;
  costPerUnit: string;
  totalCost: string;
  purchasedBy: string;
  supplierName?: string;
  timestamp: string;
}

interface Product {
  id: number;
  name: string;
  productCode: string;
  imageUrl?: string;
}

export default function Purchases() {
  const [showRecordPurchase, setShowRecordPurchase] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: purchases = [], isLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
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

  const filteredPurchases = purchases.filter(purchase => {
    const product = getProductInfo(purchase.productId);
    return product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           product?.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
           purchase.supplierName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate stats
  const todaysPurchases = purchases.filter(purchase => {
    const purchaseDate = new Date(purchase.timestamp);
    const today = new Date();
    return purchaseDate.toDateString() === today.toDateString();
  });

  const totalSpent = purchases.reduce((sum, purchase) => sum + Number(purchase.totalCost), 0);
  const todaysSpent = todaysPurchases.reduce((sum, purchase) => sum + Number(purchase.totalCost), 0);
  const totalItemsReceived = purchases.reduce((sum, purchase) => sum + purchase.quantityReceived, 0);

  // Get unique suppliers
  const uniqueSuppliers = [...new Set(purchases.map(p => p.supplierName).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 pt-16 p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
              <p className="text-gray-600">Track inventory purchases and supplier transactions</p>
            </div>
            <Button onClick={() => setShowRecordPurchase(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Record Purchase
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Truck className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                    <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Today's Spending</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(todaysSpent)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Items Received</p>
                    <p className="text-2xl font-bold text-gray-900">{totalItemsReceived}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suppliers Card */}
          {uniqueSuppliers.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Active Suppliers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {uniqueSuppliers.map((supplier, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {supplier}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Purchases Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Purchase History</CardTitle>
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search purchases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading purchases...</div>
              ) : filteredPurchases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? "No purchases found matching your search" : "No purchases recorded yet. Record your first purchase to get started."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Cost per Unit</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Purchased By</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPurchases.map((purchase) => {
                        const product = getProductInfo(purchase.productId);
                        return (
                          <TableRow key={purchase.id}>
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
                              {purchase.supplierName ? (
                                <Badge variant="outline">
                                  {purchase.supplierName}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-sm">No supplier</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{purchase.quantityReceived}</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {formatCurrency(purchase.costPerUnit)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-red-600">
                                {formatCurrency(purchase.totalCost)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {purchase.purchasedBy}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {formatDateTime(purchase.timestamp)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Received
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
        </main>
      </div>

      {/* Record Purchase Modal */}
      <RecordPurchaseModal 
        open={showRecordPurchase} 
        onOpenChange={setShowRecordPurchase} 
      />
    </div>
  );
}
