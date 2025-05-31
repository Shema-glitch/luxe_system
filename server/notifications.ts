
import { Request, Response } from "express";

interface Notification {
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

// Mock notification storage (in production, this would be in a database)
let notifications: Notification[] = [
  {
    id: "1",
    type: "low_stock",
    title: "Low Stock Alert",
    message: "iPhone 14 Pro is running low on stock (2 units remaining)",
    data: { productId: "1", productName: "iPhone 14 Pro", currentStock: 2, minStock: 5 },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    actionType: "restock",
    actionLabel: "Add to Purchase List"
  },
  {
    id: "2",
    type: "new_sale",
    title: "New Sale Recorded",
    message: "Sale of MacBook Air M2 for $1,299.00 by John Doe",
    data: { saleId: "1", productName: "MacBook Air M2", amount: 1299, employee: "John Doe" },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    actionType: "view_details",
    actionLabel: "View Sale"
  },
  {
    id: "3",
    type: "purchase_reminder",
    title: "Purchase Order Due",
    message: "Purchase order #PO-001 from Apple Inc. is due for delivery today",
    data: { purchaseOrderId: "PO-001", supplier: "Apple Inc.", dueDate: new Date().toISOString() },
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    actionType: "approve",
    actionLabel: "Mark as Received"
  },
  {
    id: "4",
    type: "employee_activity",
    title: "New Employee Added",
    message: "Jane Smith has been added to the system with cashier role",
    data: { employeeId: "emp-001", employeeName: "Jane Smith", role: "cashier" },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
  },
  {
    id: "5",
    type: "system",
    title: "System Backup Complete",
    message: "Daily backup completed successfully at 3:00 AM",
    data: { backupTime: "03:00", status: "success" },
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
  }
];

export function getNotifications(req: Request, res: Response) {
  // Sort by creation date, newest first
  const sortedNotifications = notifications.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  res.json(sortedNotifications);
}

export function markNotificationAsRead(req: Request, res: Response) {
  const { id } = req.params;
  
  const notification = notifications.find(n => n.id === id);
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }
  
  notification.read = true;
  res.json({ success: true });
}

export function dismissNotification(req: Request, res: Response) {
  const { id } = req.params;
  
  const index = notifications.findIndex(n => n.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Notification not found" });
  }
  
  notifications.splice(index, 1);
  res.json({ success: true });
}

export function markAllAsRead(req: Request, res: Response) {
  notifications.forEach(n => n.read = true);
  res.json({ success: true });
}

export function executeNotificationAction(req: Request, res: Response) {
  const { id } = req.params;
  const { actionType, data } = req.body;
  
  const notification = notifications.find(n => n.id === id);
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }
  
  // Mark as read when action is executed
  notification.read = true;
  
  // Handle different action types
  switch (actionType) {
    case 'restock':
      // In a real app, this would add the product to a purchase order
      console.log(`Adding ${data.productName} to purchase list`);
      break;
    case 'view_details':
      // In a real app, this would redirect to the details page
      console.log(`Viewing details for ${actionType}`);
      break;
    case 'approve':
      // In a real app, this would approve the request
      console.log(`Approving action for notification ${id}`);
      break;
    default:
      break;
  }
  
  res.json({ success: true, actionType });
}

// Function to add new notifications (for demo purposes)
export function addNotification(type: string, title: string, message: string, data?: any) {
  const notification: Notification = {
    id: Date.now().toString(),
    type: type as any,
    title,
    message,
    data,
    read: false,
    createdAt: new Date().toISOString(),
  };
  
  // Add action types based on notification type
  if (type === 'low_stock') {
    notification.actionType = 'restock';
    notification.actionLabel = 'Add to Purchase List';
  } else if (type === 'new_sale') {
    notification.actionType = 'view_details';
    notification.actionLabel = 'View Sale';
  } else if (type === 'purchase_reminder') {
    notification.actionType = 'approve';
    notification.actionLabel = 'Mark as Received';
  }
  
  notifications.unshift(notification);
  return notification;
}
