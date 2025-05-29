import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3,
  Package,
  Tags,
  ShoppingCart,
  Truck,
  ArrowUpDown,
  Users,
  FileText,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: BarChart3,
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
  },
  {
    title: "Categories",
    href: "/categories",
    icon: Tags,
  },
  {
    title: "Sales",
    href: "/sales",
    icon: ShoppingCart,
  },
  {
    title: "Purchases",
    href: "/purchases",
    icon: Truck,
  },
  {
    title: "Stock Movement",
    href: "/stock-movement",
    icon: ArrowUpDown,
  },
  {
    title: "Employees",
    href: "/employees",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    adminOnly: true,
  },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  const adminOnlyItems = filteredNavItems.filter(item => item.adminOnly);
  const regularItems = filteredNavItems.filter(item => !item.adminOnly);

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-sm border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {regularItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <button
              key={item.href}
              onClick={() => setLocation(item.href)}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg w-full text-left transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </button>
          );
        })}
        
        {adminOnlyItems.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Admin Only
            </p>
            
            {adminOnlyItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <button
                  key={item.href}
                  onClick={() => setLocation(item.href)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg w-full text-left transition-colors",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}
