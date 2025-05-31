import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSession, requireAuth, requireAdmin, authenticateUser, registerUser } from "./auth";
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

      req.session.userId = user.id;
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
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const registerData = registerSchema.parse(req.body);
      const user = await registerUser(registerData);

      if (!user) {
        return res.status(400).json({ message: "Registration failed" });
      }

      req.session.userId = user.id;
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
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
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
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
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
      const purchaseData = insertPurchaseSchema.parse(req.body);
      const purchase = {
        ...purchaseData,
        purchasedBy: req.user.claims.sub,
        totalCost: Number(purchaseData.costPerUnit) * purchaseData.quantityReceived,
      };
      const newPurchase = await storage.createPurchase(purchase);
      res.json(newPurchase);
    } catch (error) {
      console.error("Error creating purchase:", error);
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  // Sale routes
  app.get('/api/sales', requireAuth, async (req, res) => {
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

  app.post('/api/sales', requireAuth, async (req: any, res) => {
    try {
      const saleData = insertSaleSchema.parse(req.body);

      const result = await db.insert(sales).values({
        productId: Number(saleData.productId),
        quantity: Number(saleData.quantitySold),
        unitPrice: Number(saleData.salePrice),
        totalAmount: Number(saleData.quantitySold) * Number(saleData.salePrice),
        employeeId: req.user!.id,
        createdAt: new Date()
      }).returning();

      // Update product stock
      await db.update(products)
        .set({ 
          stock: sql`${products.stock} - ${saleData.quantitySold}`,
          updatedAt: new Date()
        })
        .where(eq(products.id, Number(saleData.productId)));

      // Get product details for notification
      const [product] = await db.select().from(products).where(eq(products.id, Number(saleData.productId)));

      // Add new sale notification
      addNotification(
        'new_sale',
        'New Sale Recorded',
        `Sale of ${product.name} for $${(Number(saleData.quantitySold) * Number(saleData.salePrice)).toFixed(2)} by ${req.user!.firstName || req.user!.email}`,
        { 
          saleId: result[0].id, 
          productName: product.name, 
          amount: Number(saleData.quantitySold) * Number(saleData.salePrice), 
          employee: req.user!.firstName || req.user!.email 
        }
      );

      // Check if stock is low after sale
      if (product.stock - Number(saleData.quantitySold) <= 5) {
        addNotification(
          'low_stock',
          'Low Stock Alert',
          `${product.name} is running low on stock (${product.stock - Number(saleData.quantitySold)} units remaining)`,
          { 
            productId: product.id, 
            productName: product.name, 
            currentStock: product.stock - Number(saleData.quantitySold), 
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

  // Stock movement routes
  app.get('/api/stock-movements', requireAuth, async (req, res) => {
    try {
      const movements = await storage.getStockMovements();
      res.json(movements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({ message: "Failed to fetch stock movements" });
    }
  });

  app.post('/api/stock-movements', requireAuth, async (req: any, res) => {
    try {
      const movementData = insertStockMovementSchema.parse(req.body);
      const movement = {
        ...movementData,
        performedBy: req.user.claims.sub,
      };
      const newMovement = await storage.createStockMovement(movement);
      res.json(newMovement);
    } catch (error) {
      console.error("Error creating stock movement:", error);
      res.status(500).json({ message: "Failed to create stock movement" });
    }
  });

  // Reports
  //app.get("/api/reports/sales", getSalesReport);
  //app.get("/api/reports/inventory", getInventoryReport);
  //app.get("/api/reports/low-stock", getLowStockReport);

  // Notifications
  app.get("/api/notifications", getNotifications);
  app.patch("/api/notifications/:id/read", markNotificationAsRead);
  app.delete("/api/notifications/:id", dismissNotification);
  app.patch("/api/notifications/mark-all-read", markAllAsRead);
  app.post("/api/notifications/:id/action", executeNotificationAction);

  const httpServer = createServer(app);
  return httpServer;
}