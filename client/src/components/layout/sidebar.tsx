import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/contexts/sidebar-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Building2,
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Truck,
  BarChart3,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Settings,
  User,
  ArrowLeftRight,
  ShoppingBag,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
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
    title: "Stock Movement",
    href: "/stock-movement",
    icon: ArrowLeftRight,
  },
  {
    title: "Purchases",
    href: "/purchases",
    icon: ShoppingBag,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    adminOnly: true,
  },
];

const adminNavigation = [
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const { isCollapsed, toggle } = useSidebar();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white transition-all duration-300",
        isCollapsed && "w-20"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Building2 className={cn("h-6 w-6 text-blue-600", isCollapsed && "mx-auto")} />
          {!isCollapsed && (
            <span className="text-lg font-semibold text-gray-900">Luxe Systems</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)]">
        <nav className="space-y-1 p-2">
          {navigationItems.map((item) => {
            // For admin users, show all items
            if (isAdmin) {
              return (
                <NavLink
                  key={item.title}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      isCollapsed && "justify-center px-2"
                    )
                  }
                >
                  <item.icon className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                  {!isCollapsed && <span>{item.title}</span>}
                </NavLink>
              );
            }

            // For non-admin users, check permissions
            if (item.adminOnly && !isAdmin) {
              return null;
            }

            return (
              <NavLink
                key={item.title}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    isCollapsed && "justify-center px-2"
                  )
                }
              >
                <item.icon className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                {!isCollapsed && <span>{item.title}</span>}
              </NavLink>
            );
          })}

          {/* Admin Navigation */}
          {isAdmin && (
            <>
              <div className={cn("my-2 border-t", isCollapsed ? "mx-2" : "mx-4")} />
              {adminNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      isCollapsed && "justify-center px-2"
                    )
                  }
                >
                  <item.icon className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                  {!isCollapsed && <span>{item.name}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}
