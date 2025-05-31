
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

export interface Notification {
  id: string;
  type: 'low_stock' | 'new_sale' | 'purchase_reminder' | 'employee_activity' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  actionType?: 'restock' | 'view_details' | 'approve' | 'dismiss';
  actionLabel?: string;
}

export function useNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Dismiss notification
  const dismissMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to dismiss notification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notification dismissed",
        description: "The notification has been removed.",
      });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Execute notification action
  const executeActionMutation = useMutation({
    mutationFn: async ({ notificationId, actionType, data }: { 
      notificationId: string; 
      actionType: string; 
      data?: any; 
    }) => {
      const response = await fetch(`/api/notifications/${notificationId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, data }),
      });
      if (!response.ok) throw new Error('Failed to execute action');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      
      if (variables.actionType === 'restock') {
        toast({
          title: "Restock initiated",
          description: "Product has been added to purchase list.",
        });
      } else if (variables.actionType === 'approve') {
        toast({
          title: "Action approved",
          description: "The request has been approved.",
        });
      }
    },
  });

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  const getNotificationsByType = (type: string) => 
    notifications.filter((n: Notification) => n.type === type);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return '📦';
      case 'new_sale': return '💰';
      case 'purchase_reminder': return '🛒';
      case 'employee_activity': return '👥';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'low_stock': return 'text-red-600';
      case 'new_sale': return 'text-green-600';
      case 'purchase_reminder': return 'text-blue-600';
      case 'employee_activity': return 'text-purple-600';
      case 'system': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    dismiss: dismissMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    executeAction: executeActionMutation.mutate,
    getNotificationsByType,
    getNotificationIcon,
    getNotificationColor,
    isMarkingAsRead: markAsReadMutation.isPending,
    isDismissing: dismissMutation.isPending,
    isExecutingAction: executeActionMutation.isPending,
  };
}
