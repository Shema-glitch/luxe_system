import {
  users,
  mainCategories,
  subCategories,
  products,
  purchases,
  sales,
  stockMovements,
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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
}

export const storage = new DatabaseStorage();
