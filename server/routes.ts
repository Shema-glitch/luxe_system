import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSession, requireAuth, requireAdmin, requirePermission, authenticateUser, registerUser } from "./auth";
import { loginSchema, registerSchema } from "@shared/schema";
import {
  insertMainCategorySchema,
  insertSubCategorySchema,
  insertProductSchema,
  insertPurchaseSchema,
  insertSaleSchema,
  insertStockMovementSchema,
} from "@shared/schema";
import { Request, Response } from "express";
import { db } from "./db";
import { products, categories, sales, purchases, stockMovements, users } from "../shared/schema";
import { eq, sql, desc, and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { 
  getNotifications, 
  markNotificationAsRead, 
  dismissNotification, 
  markAllAsRead, 
  executeNotificationAction,
  addNotification 
} from "./notifications";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(getSession());

  // Traditional authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const user = await authenticateUser(loginData);

      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Set session
      req.session.userId = user.id;
      
      // Send user data without sensitive information
      res.json({ 
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const registerData = registerSchema.parse(req.body);
      const user = await registerUser(registerData);

      if (!user) {
        return res.status(400).json({ message: "Registration failed" });
      }

      // Set session
      req.session.userId = user.id;

      // Send user data without sensitive information
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      // Send user data without sensitive information
      res.json({
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        permissions: req.user.permissions
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.json({ message: "Logged out successfully" });
    });
  });

  // Employee management routes
  app.get('/api/employees', requireAuth, requireAdmin, async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post('/api/employees', requireAuth, requireAdmin, async (req, res) => {
    try {
      const employeeData = registerSchema.parse(req.body);
      const user = await registerUser(employeeData);

      if (!user) {
        return res.status(400).json({ message: "Failed to create employee" });
      }

      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions
      });
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(400).json({ message: error.message || "Failed to create employee" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Category routes
  app.get('/api/categories/main', requireAuth, async (req, res) => {
    try {
      const categories = await storage.getMainCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching main categories:", error);
      res.status(500).json({ message: "Failed to fetch main categories" });
    }
  });

  app.post('/api/categories/main', requireAuth, async (req, res) => {
    try {
      const category = insertMainCategorySchema.parse(req.body);
      const newCategory = await storage.createMainCategory(category);
      res.json(newCategory);
    } catch (error) {
      console.error("Error creating main category:", error);
      res.status(500).json({ message: "Failed to create main category" });
    }
  });

  app.get('/api/categories/sub', requireAuth, async (req, res) => {
    try {
      const mainCategoryId = req.query.mainCategoryId ? Number(req.query.mainCategoryId) : undefined;
      const categories = await storage.getSubCategories(mainCategoryId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching sub categories:", error);
      res.status(500).json({ message: "Failed to fetch sub categories" });
    }
  });

  app.post('/api/categories/sub', requireAuth, async (req, res) => {
    try {
      const category = insertSubCategorySchema.parse(req.body);
      const newCategory = await storage.createSubCategory(category);
      res.json(newCategory);
    } catch (error) {
      console.error("Error creating sub category:", error);
      res.status(500).json({ message: "Failed to create sub category" });
    }
  });

  // Product routes
  app.get('/api/products', requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/low-stock', requireAuth, async (req, res) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  app.post('/api/products', requireAuth, async (req, res) => {
    try {
      const product = insertProductSchema.parse(req.body);
      const newProduct = await storage.createProduct(product);
      res.json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/products/:id', requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const product = insertProductSchema.partial().parse(req.body);
      const updatedProduct = await storage.updateProduct(id, product);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Purchase routes
  app.get('/api/purchases', requireAuth, async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.post('/api/purchases', requireAuth, async (req: any, res) => {
    try {
      const purchaseData = insertPurchaseSchema.parse({
        productId: Number(req.body.productId),
        quantityReceived: Number(req.body.quantityReceived),
        costPerUnit: req.body.costPerUnit,
        totalCost: (Number(req.body.quantityReceived) * Number(req.body.costPerUnit)).toString(),
        purchasedBy: req.user.username || req.user.email,
        supplierName: req.body.supplierName
      });

      const result = await db.insert(purchases).values({
        productId: purchaseData.productId,
        quantityReceived: purchaseData.quantityReceived,
        costPerUnit: purchaseData.costPerUnit,
        totalCost: purchaseData.totalCost,
        purchasedBy: purchaseData.purchasedBy,
        supplierName: purchaseData.supplierName,
        timestamp: new Date()
      }).returning();

      // Update product stock
      await db.update(products)
        .set({ 
          stockQuantity: sql`${products.stockQuantity} + ${purchaseData.quantityReceived}`,
          updatedAt: new Date()
        })
        .where(eq(products.id, purchaseData.productId));

      // Get product details for notification
      const [product] = await db.select().from(products).where(eq(products.id, purchaseData.productId));

      // Add new purchase notification
      addNotification(
        'new_purchase',
        'New Purchase Recorded',
        `Purchase of ${product.name} for $${purchaseData.totalCost} by ${purchaseData.purchasedBy}`,
        { 
          purchaseId: result[0].id, 
          productName: product.name, 
          amount: purchaseData.totalCost, 
          employee: purchaseData.purchasedBy 
        }
      );

      res.json(result[0]);
    } catch (error) {
      console.error("Error creating purchase:", error);
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  // Stock movement routes
  app.get('/api/stock-movements', requireAuth, requirePermission("stock_in"), async (req, res) => {
    try {
      const movements = await storage.getStockMovements();
      res.json(movements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({ message: "Failed to fetch stock movements" });
    }
  });

  app.post('/api/stock-movements', requireAuth, requirePermission("stock_in"), async (req: any, res) => {
    try {
      const movementData = insertStockMovementSchema.parse({
        productId: Number(req.body.productId),
        movementType: req.body.movementType,
        quantity: Number(req.body.quantity),
        reason: req.body.reason,
        performedBy: req.user.id
      });

      // Check if enough stock is available for 'out' movements
      if (movementData.movementType === 'out') {
        const [product] = await db.select().from(products).where(eq(products.id, movementData.productId));
        if (!product || product.stockQuantity < movementData.quantity) {
          return res.status(400).json({ message: "Insufficient stock available" });
        }
      }

      const result = await db.insert(stockMovements).values({
        productId: movementData.productId,
        movementType: movementData.movementType,
        quantity: movementData.quantity,
        reason: movementData.reason,
        performedBy: movementData.performedBy,
        timestamp: new Date()
      }).returning();

      // Update product stock
      await db.update(products)
        .set({ 
          stockQuantity: movementData.movementType === 'in' 
            ? sql`${products.stockQuantity} + ${movementData.quantity}`
            : sql`${products.stockQuantity} - ${movementData.quantity}`,
          updatedAt: new Date()
        })
        .where(eq(products.id, movementData.productId));

      // Get product details for notification
      const [product] = await db.select().from(products).where(eq(products.id, movementData.productId));

      // Add stock movement notification
      addNotification(
        'stock_movement',
        'Stock Movement Recorded',
        `${movementData.movementType === 'in' ? 'Added' : 'Removed'} ${movementData.quantity} units of ${product.name} by ${req.user.username || req.user.email}`,
        { 
          movementId: result[0].id, 
          productName: product.name, 
          quantity: movementData.quantity,
          type: movementData.movementType,
          employee: req.user.username || req.user.email 
        }
      );

      // Check if stock is low after movement
      if (product.stockQuantity + (movementData.movementType === 'in' ? movementData.quantity : -movementData.quantity) <= 5) {
        addNotification(
          'low_stock',
          'Low Stock Alert',
          `${product.name} is running low on stock (${product.stockQuantity + (movementData.movementType === 'in' ? movementData.quantity : -movementData.quantity)} units remaining)`,
          { 
            productId: product.id, 
            productName: product.name, 
            currentStock: product.stockQuantity + (movementData.movementType === 'in' ? movementData.quantity : -movementData.quantity), 
            minStock: 5 
          }
        );
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Error creating stock movement:", error);
      res.status(500).json({ message: "Failed to create stock movement" });
    }
  });

  // Sales routes
  app.get('/api/sales', requireAuth, requirePermission("sales"), async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get('/api/sales/recent', requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const sales = await storage.getRecentSales(limit);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching recent sales:", error);
      res.status(500).json({ message: "Failed to fetch recent sales" });
    }
  });

  app.post('/api/sales', requireAuth, requirePermission("sales"), async (req: any, res) => {
    try {
      const saleData = insertSaleSchema.parse({
        productId: Number(req.body.productId),
        quantitySold: Number(req.body.quantitySold),
        salePrice: req.body.salePrice,
        totalAmount: (Number(req.body.quantitySold) * Number(req.body.salePrice)).toString(),
        soldBy: req.user.username || req.user.email
      });

      const result = await db.insert(sales).values({
        productId: saleData.productId,
        quantitySold: saleData.quantitySold,
        salePrice: saleData.salePrice,
        totalAmount: saleData.totalAmount,
        soldBy: saleData.soldBy,
        timestamp: new Date()
      }).returning();

      // Update product stock
      await db.update(products)
        .set({ 
          stockQuantity: sql`${products.stockQuantity} - ${saleData.quantitySold}`,
          updatedAt: new Date()
        })
        .where(eq(products.id, saleData.productId));

      // Get product details for notification
      const [product] = await db.select().from(products).where(eq(products.id, saleData.productId));

      // Add new sale notification
      addNotification(
        'new_sale',
        'New Sale Recorded',
        `Sale of ${product.name} for $${saleData.totalAmount} by ${saleData.soldBy}`,
        { 
          saleId: result[0].id, 
          productName: product.name, 
          amount: saleData.totalAmount, 
          employee: saleData.soldBy 
        }
      );

      // Check if stock is low after sale
      if (product.stockQuantity - saleData.quantitySold <= 5) {
        addNotification(
          'low_stock',
          'Low Stock Alert',
          `${product.name} is running low on stock (${product.stockQuantity - saleData.quantitySold} units remaining)`,
          { 
            productId: product.id, 
            productName: product.name, 
            currentStock: product.stockQuantity - saleData.quantitySold, 
            minStock: 5 
          }
        );
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // Reports routes
  app.get("/api/reports/sales", requireAuth, requirePermission("view_reports"), async (req, res) => {
    try {
      const report = await storage.getSalesReport();
      res.json(report);
    } catch (error) {
      console.error("Error fetching sales report:", error);
      res.status(500).json({ message: "Failed to fetch sales report" });
    }
  });

  app.get("/api/reports/inventory", requireAuth, requirePermission("view_reports"), async (req, res) => {
    try {
      const report = await storage.getInventoryReport();
      res.json(report);
    } catch (error) {
      console.error("Error fetching inventory report:", error);
      res.status(500).json({ message: "Failed to fetch inventory report" });
    }
  });

  app.get("/api/reports/low-stock", requireAuth, requirePermission("view_reports"), async (req, res) => {
    try {
      const report = await storage.getLowStockReport();
      res.json(report);
    } catch (error) {
      console.error("Error fetching low stock report:", error);
      res.status(500).json({ message: "Failed to fetch low stock report" });
    }
  });

  // Notifications
  app.get("/api/notifications", getNotifications);
  app.patch("/api/notifications/:id/read", markNotificationAsRead);
  app.delete("/api/notifications/:id", dismissNotification);
  app.patch("/api/notifications/mark-all-read", markAllAsRead);
  app.post("/api/notifications/:id/action", executeNotificationAction);

  const httpServer = createServer(app);
  return httpServer;
}