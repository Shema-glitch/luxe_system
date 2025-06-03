import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays, subDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Download, FileText, TrendingUp, Package, DollarSign, AlertTriangle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [reportType, setReportType] = useState("sales");

  // Fetch sales data
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["/api/reports/sales", dateRange],
    queryFn: () => apiRequest("GET", `/api/reports/sales?start=${dateRange.from?.toISOString()}&end=${dateRange.to?.toISOString()}`),
  });

  // Fetch inventory data
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/reports/inventory", dateRange],
    queryFn: () => apiRequest("GET", `/api/reports/inventory?start=${dateRange.from?.toISOString()}&end=${dateRange.to?.toISOString()}`),
  });

  // Fetch purchase data
  const { data: purchaseData, isLoading: purchaseLoading } = useQuery({
    queryKey: ["/api/reports/purchases", dateRange],
    queryFn: () => apiRequest("GET", `/api/reports/purchases?start=${dateRange.from?.toISOString()}&end=${dateRange.to?.toISOString()}`),
  });

  const isLoading = salesLoading || inventoryLoading || purchaseLoading;

  const handleExport = async (type: string) => {
    try {
      const response = await fetch(`/api/reports/export/${type}?start=${dateRange.from?.toISOString()}&end=${dateRange.to?.toISOString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            View and analyze your inventory and sales data
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales Report</SelectItem>
              <SelectItem value="inventory">Inventory Report</SelectItem>
              <SelectItem value="purchases">Purchase Report</SelectItem>
            </SelectContent>
          </Select>
          <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          <Button onClick={() => handleExport(reportType)} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
        </div>
      </div>

      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-[200px]" />
                <Skeleton className="h-[200px]" />
              </div>
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Sales Overview</CardTitle>
                  <CardDescription>
                    Total sales: {formatCurrency(salesData?.totalSales || 0)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData?.overview}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesData?.topProducts}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="quantity" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sales by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={salesData?.categoryDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {salesData?.categoryDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-[200px]" />
                <Skeleton className="h-[200px]" />
              </div>
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Stock Levels</CardTitle>
                  <CardDescription>
                    Total inventory value: {formatCurrency(inventoryData?.totalValue || 0)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inventoryData?.stockLevels}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="quantity" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Low Stock Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {inventoryData?.lowStock.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <span>{item.name}</span>
                          <span className="text-red-500">{item.quantity} remaining</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Stock Movement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={inventoryData?.movement}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="in" stroke="#00C49F" />
                          <Line type="monotone" dataKey="out" stroke="#FF8042" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-[200px]" />
                <Skeleton className="h-[200px]" />
              </div>
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Overview</CardTitle>
                  <CardDescription>
                    Total purchases: {formatCurrency(purchaseData?.totalPurchases || 0)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={purchaseData?.overview}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Suppliers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={purchaseData?.topSuppliers}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Bar dataKey="amount" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Purchase by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={purchaseData?.categoryDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {purchaseData?.categoryDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
