import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertMainCategorySchema,
  insertSubCategorySchema,
  insertProductSchema,
  insertPurchaseSchema,
  insertSaleSchema,
  insertStockMovementSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Category routes
  app.get('/api/categories/main', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getMainCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching main categories:", error);
      res.status(500).json({ message: "Failed to fetch main categories" });
    }
  });

  app.post('/api/categories/main', isAuthenticated, async (req, res) => {
    try {
      const category = insertMainCategorySchema.parse(req.body);
      const newCategory = await storage.createMainCategory(category);
      res.json(newCategory);
    } catch (error) {
      console.error("Error creating main category:", error);
      res.status(500).json({ message: "Failed to create main category" });
    }
  });

  app.get('/api/categories/sub', isAuthenticated, async (req, res) => {
    try {
      const mainCategoryId = req.query.mainCategoryId ? Number(req.query.mainCategoryId) : undefined;
      const categories = await storage.getSubCategories(mainCategoryId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching sub categories:", error);
      res.status(500).json({ message: "Failed to fetch sub categories" });
    }
  });

  app.post('/api/categories/sub', isAuthenticated, async (req, res) => {
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
  app.get('/api/products', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/low-stock', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req, res) => {
    try {
      const product = insertProductSchema.parse(req.body);
      const newProduct = await storage.createProduct(product);
      res.json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/products/:id', isAuthenticated, async (req, res) => {
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
  app.get('/api/purchases', isAuthenticated, async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.post('/api/purchases', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/sales', isAuthenticated, async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get('/api/sales/recent', isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const sales = await storage.getRecentSales(limit);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching recent sales:", error);
      res.status(500).json({ message: "Failed to fetch recent sales" });
    }
  });

  app.post('/api/sales', isAuthenticated, async (req: any, res) => {
    try {
      const saleData = insertSaleSchema.parse(req.body);
      const sale = {
        ...saleData,
        soldBy: req.user.claims.sub,
        totalAmount: Number(saleData.salePrice) * saleData.quantitySold,
      };
      const newSale = await storage.createSale(sale);
      res.json(newSale);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // Stock movement routes
  app.get('/api/stock-movements', isAuthenticated, async (req, res) => {
    try {
      const movements = await storage.getStockMovements();
      res.json(movements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({ message: "Failed to fetch stock movements" });
    }
  });

  app.post('/api/stock-movements', isAuthenticated, async (req: any, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
