import { 
  users, 
  products, 
  productVariants,
  orders,
  inventory,
  type User, 
  type InsertUser,
  type Product,
  type InsertProduct,
  type ProductVariant,
  type InsertProductVariant,
  type Order,
  type InsertOrder,
  type Inventory,
  type InsertInventory
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.category, category));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount > 0;
  }

  async getProductVariants(productId: number): Promise<ProductVariant[]> {
    return await db.select().from(productVariants).where(eq(productVariants.productId, productId));
  }

  async createProductVariant(insertVariant: InsertProductVariant): Promise<ProductVariant> {
    const [variant] = await db.insert(productVariants).values(insertVariant).returning();
    return variant;
  }

  async updateProductVariant(id: number, updates: Partial<ProductVariant>): Promise<ProductVariant | undefined> {
    const [variant] = await db.update(productVariants).set(updates).where(eq(productVariants.id, id)).returning();
    return variant;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.status, status)).orderBy(desc(orders.createdAt));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    const [order] = await db.update(orders).set(updates).where(eq(orders.id, id)).returning();
    return order;
  }

  async getInventory(productId: number): Promise<Inventory | undefined> {
    const [inv] = await db.select().from(inventory).where(eq(inventory.productId, productId));
    return inv;
  }

  async getAllInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory);
  }

  async createInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const [inv] = await db.insert(inventory).values(insertInventory).returning();
    return inv;
  }

  async updateInventory(id: number, updates: Partial<Inventory>): Promise<Inventory | undefined> {
    const [inv] = await db.update(inventory).set(updates).where(eq(inventory.id, id)).returning();
    return inv;
  }

  async getLowStockItems(): Promise<Inventory[]> {
    const allInventory = await this.getAllInventory();
    return allInventory.filter(i => 
      (i.availableQuantity || 0) < (i.minStockLevel || 10)
    );
  }

  async getOrderAnalytics(): Promise<any> {
    const allOrders = await this.getAllOrders();
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    
    return {
      totalOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    };
  }

  async getRevenueAnalytics(): Promise<any> {
    const allOrders = await this.getAllOrders();
    const monthlyData: { [key: string]: number } = {};
    
    allOrders.forEach(order => {
      const month = new Date(order.createdAt).toISOString().slice(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + parseFloat(order.totalAmount);
    });

    return {
      monthlyRevenue: Object.entries(monthlyData).map(([month, revenue]) => ({
        month,
        revenue
      }))
    };
  }

  async getCustomerAnalytics(): Promise<any> {
    const allUsers = await db.select().from(users);
    const activeCustomers = allUsers.filter(u => u.isActive).length;
    
    return {
      totalCustomers: allUsers.length,
      activeCustomers,
      customerGrowth: 0 // Would need historical data
    };
  }
}