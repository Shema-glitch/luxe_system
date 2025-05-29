import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Store, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";

export function Header() {
  const { user } = useAuth();

  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ["/api/products/low-stock"],
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">DukaSmart</h1>
            </div>
            {user?.role === 'admin' && (
              <Badge variant="secondary" className="hidden sm:inline-flex bg-primary/10 text-primary">
                Admin Access
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <Button variant="ghost" size="sm" className="relative text-gray-400 hover:text-gray-500">
              <Bell className="h-5 w-5" />
              {lowStockProducts.length > 0 && (
                <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500" />
              )}
            </Button>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 hover:bg-gray-50">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName || user?.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role || 'Employee'}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    {user?.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
