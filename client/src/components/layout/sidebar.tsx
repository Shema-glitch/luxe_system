
"use client"

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
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

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

function UserMenu() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.username}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppSidebarContent() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  const adminOnlyItems = filteredNavItems.filter(item => item.adminOnly);
  const regularItems = filteredNavItems.filter(item => !item.adminOnly);

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
              <Package className="h-4 w-4" />
            </div>
            <span className="font-semibold">DukaSmart</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {regularItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      isActive={isActive}
                      onClick={() => setLocation(item.href)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {adminOnlyItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin Only</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminOnlyItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        isActive={isActive}
                        onClick={() => setLocation(item.href)}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 text-xs text-muted-foreground">
          Stock Management System
        </div>
      </SidebarFooter>
    </>
  );
}

export function AppSidebar() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <AppSidebarContent />
    </Sidebar>
  );
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <UserMenu />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
