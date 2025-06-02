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
import { StockMovementModal } from "@/components/modals/stock-movement-modal";
import { 
  ArrowUpDown, 
  Plus, 
  Search, 
  ArrowUp,
  ArrowDown,
  Package,
  TrendingUp
} from "lucide-react";

interface StockMovement {
  id: number;
  productId: number;
  movementType: "in" | "out";
  quantity: number;
  reason?: string;
  performedBy: string;
  timestamp: string;
}

interface Product {
  id: number;
  name: string;
  productCode: string;
  imageUrl?: string;
}

export default function StockMovement() {
  const [showStockMovement, setShowStockMovement] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");

  const { data: movements = [], isLoading } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock-movements"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getProductInfo = (productId: number) => {
    return products.find(product => product.id === productId);
  };

  const filteredMovements = movements.filter(movement => {
    const product = getProductInfo(movement.productId);
    const matchesSearch = product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product?.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         movement.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === "all" || movement.movementType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const todaysMovements = movements.filter(movement => {
    const movementDate = new Date(movement.timestamp);
    const today = new Date();
    return movementDate.toDateString() === today.toDateString();
  });

  const stockInMovements = movements.filter(m => m.movementType === "in");
  const stockOutMovements = movements.filter(m => m.movementType === "out");
  
  const totalStockIn = stockInMovements.reduce((sum, movement) => sum + movement.quantity, 0);
  const totalStockOut = stockOutMovements.reduce((sum, movement) => sum + movement.quantity, 0);

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Movement</h1>
          <p className="text-gray-600">Track all stock in and out movements</p>
        </div>
        <Button onClick={() => setShowStockMovement(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Record Movement
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ArrowUpDown className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Movements</p>
                <p className="text-2xl font-bold text-gray-900">{movements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ArrowUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stock In</p>
                <p className="text-2xl font-bold text-green-600">{totalStockIn}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ArrowDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stock Out</p>
                <p className="text-2xl font-bold text-red-600">{totalStockOut}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Movements</p>
                <p className="text-2xl font-bold text-gray-900">{todaysMovements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Movements Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Movement History</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                >
                  All
                </Button>
                <Button
                  variant={filterType === "in" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("in")}
                  className={filterType === "in" ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  Stock In
                </Button>
                <Button
                  variant={filterType === "out" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("out")}
                  className={filterType === "out" ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  Stock Out
                </Button>
              </div>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search movements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading movements...</div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || filterType !== "all" ? "No movements found matching your filters" : "No stock movements recorded yet. Record your first movement to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Movement Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => {
                    const product = getProductInfo(movement.productId);
                    return (
                      <TableRow key={movement.id}>
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
                          <div className="flex items-center space-x-2">
                            {movement.movementType === "in" ? (
                              <>
                                <ArrowUp className="h-4 w-4 text-green-600" />
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  Stock In
                                </Badge>
                              </>
                            ) : (
                              <>
                                <ArrowDown className="h-4 w-4 text-red-600" />
                                <Badge variant="secondary" className="bg-red-100 text-red-800">
                                  Stock Out
                                </Badge>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${movement.movementType === "in" ? "text-green-600" : "text-red-600"}`}>
                            {movement.movementType === "in" ? "+" : "-"}{movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {movement.reason || "No reason provided"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {movement.performedBy}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatDateTime(movement.timestamp)}
                          </span>
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

      {/* Stock Movement Modal */}
      <StockMovementModal 
        open={showStockMovement} 
        onOpenChange={setShowStockMovement} 
      />
    </div>
  );
}
