import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, User, LogOut, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";

export function Header() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-4">
            {user?.role === 'admin' && (
              <Badge variant="secondary" className="hidden sm:inline-flex bg-primary/10 text-primary">
                Admin Access
              </Badge>
            )}

          {/* Notification Dropdown */}
          <NotificationDropdown />

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
    </header>
  );
}