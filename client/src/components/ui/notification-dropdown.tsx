
import React, { useState } from "react";
import { Bell, X, Check, Package, ShoppingCart, Clock, AlertCircle } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

function NotificationItem({ notification }: { notification: Notification }) {
  const { markAsRead, dismiss, executeAction, isExecutingAction } = useNotifications();

  const handleAction = (actionType: string) => {
    executeAction({ 
      notificationId: notification.id, 
      actionType,
      data: notification.data 
    });
  };

  const getActionButton = () => {
    if (!notification.actionType || !notification.actionLabel) return null;

    const buttonProps = {
      size: "sm" as const,
      className: "h-6 px-2 text-xs",
      disabled: isExecutingAction,
      onClick: () => handleAction(notification.actionType!),
    };

    switch (notification.actionType) {
      case 'restock':
        return (
          <Button variant="outline" {...buttonProps}>
            <Package className="h-3 w-3 mr-1" />
            {notification.actionLabel}
          </Button>
        );
      case 'view_details':
        return (
          <Button variant="outline" {...buttonProps}>
            View Details
          </Button>
        );
      case 'approve':
        return (
          <Button variant="default" {...buttonProps}>
            <Check className="h-3 w-3 mr-1" />
            Approve
          </Button>
        );
      default:
        return (
          <Button variant="outline" {...buttonProps}>
            {notification.actionLabel}
          </Button>
        );
    }
  };

  return (
    <div className={cn(
      "p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors",
      !notification.read && "bg-blue-50 border-blue-100"
    )}>
      <div className="flex items-start justify-between space-x-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {notification.title}
            </h4>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {new Date(notification.createdAt).toLocaleTimeString()}
            </span>
            <div className="flex items-center space-x-1">
              {getActionButton()}
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => markAsRead(notification.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                onClick={() => dismiss(notification.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'low_stock': return '📦';
    case 'new_sale': return '💰';
    case 'purchase_reminder': return '🛒';
    case 'employee_activity': return '👥';
    case 'system': return '⚙️';
    default: return '🔔';
  }
}

function NotificationTabs() {
  const { notifications, getNotificationsByType } = useNotifications();
  
  const notificationTypes = [
    { key: 'all', label: 'All', icon: Bell },
    { key: 'low_stock', label: 'Stock', icon: Package },
    { key: 'new_sale', label: 'Sales', icon: ShoppingCart },
    { key: 'purchase_reminder', label: 'Purchases', icon: Clock },
    { key: 'employee_activity', label: 'Team', icon: AlertCircle },
    { key: 'system', label: 'System', icon: AlertCircle },
  ];

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-3 h-8 p-0">
        <TabsTrigger value="all" className="text-xs py-1">
          All ({notifications.length})
        </TabsTrigger>
        <TabsTrigger value="low_stock" className="text-xs py-1">
          Stock ({getNotificationsByType('low_stock').length})
        </TabsTrigger>
        <TabsTrigger value="new_sale" className="text-xs py-1">
          Sales ({getNotificationsByType('new_sale').length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="all" className="mt-2">
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification: Notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))
          )}
        </ScrollArea>
      </TabsContent>
      
      <TabsContent value="low_stock" className="mt-2">
        <ScrollArea className="h-80">
          {getNotificationsByType('low_stock').map((notification: Notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </ScrollArea>
      </TabsContent>
      
      <TabsContent value="new_sale" className="mt-2">
        <ScrollArea className="h-80">
          {getNotificationsByType('new_sale').map((notification: Notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

export function NotificationDropdown() {
  const { unreadCount, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative text-gray-400 hover:text-gray-500">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-500"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => markAllAsRead()}
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <div className="p-2">
          <NotificationTabs />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
