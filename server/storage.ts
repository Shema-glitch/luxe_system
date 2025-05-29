import {
  users,
  mainCategories,
  subCategories,
  products,
  purchases,
  sales,
  stockMovements,
  suppliers,
  customers,
  auditLogs,
  alerts,
  salesInvoices,
  type User,
  type UpsertUser,
  type MainCategory,
  type InsertMainCategory,
  type SubCategory,
  type InsertSubCategory,
  type Product,
  type InsertProduct,
  type Purchase,
  type InsertPurchase,
  type Sale,
  type InsertSale,
  type StockMovement,
  type InsertStockMovement,
  type Supplier,
  type InsertSupplier,
  type Customer,
  type InsertCustomer,
  type AuditLog,
  type InsertAuditLog,
  type Alert,
  type InsertAlert,
  type SalesInvoice,
  type InsertSalesInvoice,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, sql, lt } from "drizzle-orm";

export interface IStorage {
  // User operations (required for traditional auth)
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'>): Promise<User>;
  updateUserLastLogin(userId: number): Promise<void>;

  // Category operations
  getMainCategories(): Promise<MainCategory[]>;
  createMainCategory(category: InsertMainCategory): Promise<MainCategory>;
  getSubCategories(mainCategoryId?: number): Promise<SubCategory[]>;
  createSubCategory(category: InsertSubCategory): Promise<SubCategory>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  getLowStockProducts(): Promise<Product[]>;
  updateProductStock(productId: number, newQuantity: number): Promise<void>;

  // Purchase operations
  getPurchases(): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;

  // Sale operations
  getSales(): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  getRecentSales(limit?: number): Promise<Sale[]>;

  // Stock movement operations
  getStockMovements(): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalProducts: number;
    todaySales: number;
    lowStockCount: number;
    totalInventoryValue: number;
  }>;

  // Enterprise features
  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;

  // Alerts
  getAlerts(userId?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(alertId: number): Promise<void>;

  // Audit logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;

  // Sales Invoices
  getSalesInvoices(): Promise<SalesInvoice[]>;
  createSalesInvoice(invoice: InsertSalesInvoice): Promise<SalesInvoice>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserLastLogin(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Category operations
  async getMainCategories(): Promise<MainCategory[]> {
    return await db.select().from(mainCategories).orderBy(asc(mainCategories.name));
  }

  async createMainCategory(category: InsertMainCategory): Promise<MainCategory> {
    const [newCategory] = await db
      .insert(mainCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async getSubCategories(mainCategoryId?: number): Promise<SubCategory[]> {
    const query = db.select().from(subCategories);
    if (mainCategoryId) {
      return await query.where(eq(subCategories.mainCategoryId, mainCategoryId));
    }
    return await query.orderBy(asc(subCategories.name));
  }

  async createSubCategory(category: InsertSubCategory): Promise<SubCategory> {
    const [newCategory] = await db
      .insert(subCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(sql`${products.stockQuantity} <= ${products.lowStockThreshold}`)
      .orderBy(asc(products.stockQuantity));
  }

  async updateProductStock(productId: number, newQuantity: number): Promise<void> {
    await db
      .update(products)
      .set({ stockQuantity: newQuantity })
      .where(eq(products.id, productId));
  }

  // Purchase operations
  async getPurchases(): Promise<Purchase[]> {
    return await db.select().from(purchases).orderBy(desc(purchases.timestamp));
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    return await db.transaction(async (tx) => {
      // Create purchase record
      const [newPurchase] = await tx
        .insert(purchases)
        .values(purchase)
        .returning();

      // Update product stock
      await tx
        .update(products)
        .set({
          stockQuantity: sql`${products.stockQuantity} + ${purchase.quantityReceived}`,
        })
        .where(eq(products.id, purchase.productId));

      return newPurchase;
    });
  }

  // Sale operations
  async getSales(): Promise<Sale[]> {
    return await db.select().from(sales).orderBy(desc(sales.timestamp));
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    return await db.transaction(async (tx) => {
      // Check if enough stock is available
      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, sale.productId));

      if (!product || product.stockQuantity < sale.quantitySold) {
        throw new Error("Insufficient stock");
      }

      // Create sale record
      const [newSale] = await tx
        .insert(sales)
        .values(sale)
        .returning();

      // Update product stock
      await tx
        .update(products)
        .set({
          stockQuantity: sql`${products.stockQuantity} - ${sale.quantitySold}`,
        })
        .where(eq(products.id, sale.productId));

      return newSale;
    });
  }

  async getRecentSales(limit: number = 10): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .orderBy(desc(sales.timestamp))
      .limit(limit);
  }

  // Stock movement operations
  async getStockMovements(): Promise<StockMovement[]> {
    return await db.select().from(stockMovements).orderBy(desc(stockMovements.timestamp));
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    return await db.transaction(async (tx) => {
      // Create movement record
      const [newMovement] = await tx
        .insert(stockMovements)
        .values(movement)
        .returning();

      // Update product stock based on movement type
      const stockChange = movement.movementType === 'in' ? movement.quantity : -movement.quantity;
      
      await tx
        .update(products)
        .set({
          stockQuantity: sql`${products.stockQuantity} + ${stockChange}`,
        })
        .where(eq(products.id, movement.productId));

      return newMovement;
    });
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalProducts: number;
    todaySales: number;
    lowStockCount: number;
    totalInventoryValue: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total products
    const [{ totalProducts }] = await db
      .select({ totalProducts: sql<number>`count(*)` })
      .from(products);

    // Get today's sales
    const [{ todaySales }] = await db
      .select({ todaySales: sql<number>`coalesce(sum(${sales.totalAmount}), 0)` })
      .from(sales)
      .where(sql`${sales.timestamp} >= ${today}`);

    // Get low stock count
    const [{ lowStockCount }] = await db
      .select({ lowStockCount: sql<number>`count(*)` })
      .from(products)
      .where(sql`${products.stockQuantity} <= ${products.lowStockThreshold}`);

    // Get total inventory value
    const [{ totalInventoryValue }] = await db
      .select({ 
        totalInventoryValue: sql<number>`coalesce(sum(${products.price} * ${products.stockQuantity}), 0)` 
      })
      .from(products);

    return {
      totalProducts: Number(totalProducts),
      todaySales: Number(todaySales),
      lowStockCount: Number(lowStockCount),
      totalInventoryValue: Number(totalInventoryValue),
    };
  }

  // Enterprise features implementation
  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(asc(suppliers.name));
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set(supplier)
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(asc(customers.name));
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  // Alerts
  async getAlerts(userId?: number): Promise<Alert[]> {
    if (userId) {
      return await db.select().from(alerts)
        .where(eq(alerts.userId, userId))
        .orderBy(desc(alerts.createdAt));
    }
    return await db.select().from(alerts).orderBy(desc(alerts.createdAt));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async markAlertAsRead(alertId: number): Promise<void> {
    await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, alertId));
  }

  // Audit logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  // Sales Invoices
  async getSalesInvoices(): Promise<SalesInvoice[]> {
    return await db.select().from(salesInvoices).orderBy(desc(salesInvoices.createdAt));
  }

  async createSalesInvoice(invoice: InsertSalesInvoice): Promise<SalesInvoice> {
    const [newInvoice] = await db.insert(salesInvoices).values(invoice).returning();
    return newInvoice;
  }
}

export const storage = new DatabaseStorage();
