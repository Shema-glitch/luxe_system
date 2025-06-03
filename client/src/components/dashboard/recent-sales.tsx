import { Package } from "lucide-react";

interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  amount: number;
  timestamp: string;
}

interface RecentSalesProps {
  data?: Sale[];
}

export function RecentSales({ data = [] }: RecentSalesProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(value);
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
    <div className="space-y-8">
      {data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No recent sales
        </div>
      ) : (
        data.map((sale) => (
          <div key={sale.id} className="flex items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                {sale.productName}
              </p>
              <p className="text-sm text-muted-foreground">
                {sale.quantity} × {formatCurrency(sale.amount / sale.quantity)}
              </p>
            </div>
            <div className="ml-auto font-medium">
              {formatCurrency(sale.amount)}
            </div>
            <div className="ml-4 text-sm text-muted-foreground">
              {formatTimeAgo(sale.timestamp)}
            </div>
          </div>
        ))
      )}
    </div>
  );
} 