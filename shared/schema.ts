import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("employee"), // admin or employee
  permissions: jsonb("permissions").default([]), // array of permission strings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mainCategories = pgTable("main_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subCategories = pgTable("sub_categories", {
  id: serial("id").primaryKey(),
  mainCategoryId: integer("main_category_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  productCode: varchar("product_code", { length: 50 }).notNull().unique(),
  imageUrl: varchar("image_url", { length: 500 }),
  subCategoryId: integer("sub_category_id").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  createdAt: timestamp("created_at").defaultNow(),
});

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  quantityReceived: integer("quantity_received").notNull(),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  purchasedBy: varchar("purchased_by").notNull(),
  supplierName: varchar("supplier_name", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  quantitySold: integer("quantity_sold").notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  soldBy: varchar("sold_by").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  movementType: varchar("movement_type", { length: 10 }).notNull(), // 'in' or 'out'
  quantity: integer("quantity").notNull(),
  reason: varchar("reason", { length: 255 }),
  performedBy: varchar("performed_by").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const mainCategoriesRelations = relations(mainCategories, ({ many }) => ({
  subCategories: many(subCategories),
}));

export const subCategoriesRelations = relations(subCategories, ({ one, many }) => ({
  mainCategory: one(mainCategories, {
    fields: [subCategories.mainCategoryId],
    references: [mainCategories.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  subCategory: one(subCategories, {
    fields: [products.subCategoryId],
    references: [subCategories.id],
  }),
  purchases: many(purchases),
  sales: many(sales),
  stockMovements: many(stockMovements),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  product: one(products, {
    fields: [purchases.productId],
    references: [products.id],
  }),
  purchasedByUser: one(users, {
    fields: [purchases.purchasedBy],
    references: [users.id],
  }),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  product: one(products, {
    fields: [sales.productId],
    references: [products.id],
  }),
  soldByUser: one(users, {
    fields: [sales.soldBy],
    references: [users.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  performedByUser: one(users, {
    fields: [stockMovements.performedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertMainCategorySchema = createInsertSchema(mainCategories).omit({
  id: true,
  createdAt: true,
});

export const insertSubCategorySchema = createInsertSchema(subCategories).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  timestamp: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  timestamp: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  timestamp: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type MainCategory = typeof mainCategories.$inferSelect;
export type InsertMainCategory = z.infer<typeof insertMainCategorySchema>;
export type SubCategory = typeof subCategories.$inferSelect;
export type InsertSubCategory = z.infer<typeof insertSubCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
