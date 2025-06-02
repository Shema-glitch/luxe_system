import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Store,
  ArrowLeftRight,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    show: true, // Everyone can see dashboard
  },
  {
    name: "Products",
    href: "/products",
    icon: Package,
    show: true, // Everyone can see products
  },
  {
    name: "Categories",
    href: "/categories",
    icon: Tags,
    show: true, // Everyone can see categories
  },
  {
    name: "Sales",
    href: "/sales",
    icon: ShoppingCart,
    show: (user: any) => user?.role === "admin" || user?.permissions?.includes("sales"),
  },
  {
    name: "Purchases",
    href: "/purchases",
    icon: Store,
    show: (user: any) => user?.role === "admin" || user?.permissions?.includes("purchases"),
  },
  {
    name: "Stock Movement",
    href: "/stock-movement",
    icon: ArrowLeftRight,
    show: (user: any) => user?.role === "admin" || user?.permissions?.includes("stock_in"),
  },
  {
    name: "Employees",
    href: "/employees",
    icon: Users,
    show: (user: any) => user?.role === "admin",
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    show: (user: any) => user?.role === "admin" || user?.permissions?.includes("view_reports"),
  },
];

export function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();

  // Filter navigation items based on user role and permissions
  const navigation = navigationItems.filter((item) => {
    if (typeof item.show === "function") {
      return item.show(user);
    }
    return item.show;
  });

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r transition-all duration-300",
        isCollapsed && "w-20"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!isCollapsed && (
          <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      <nav className="space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Link
                  to={item.href}
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-900"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  {item.name}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>
    </div>
  );
}
