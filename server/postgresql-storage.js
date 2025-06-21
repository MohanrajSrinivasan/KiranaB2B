import { db } from "./db.js";
import { users, products, productVariants, orders, inventory } from "@shared/schema.js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

class PostgreSQLStorage {
  // User methods
  async getUser(id) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email) {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(insertUser) {
    try {
      const hashedPassword = await bcrypt.hash(insertUser.password, 10);
      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          password: hashedPassword,
        })
        .returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id, updates) {
    try {
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }
      const [user] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return user || undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateStripeCustomerId(userId, customerId) {
    return this.updateUser(userId, { stripeCustomerId: customerId });
  }

  async updateUserStripeInfo(userId, { customerId, subscriptionId }) {
    return this.updateUser(userId, { 
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId 
    });
  }

  // Product methods
  async getAllProducts() {
    try {
      const allProducts = await db.select().from(products).where(eq(products.isActive, true));
      return allProducts;
    } catch (error) {
      console.error('Error getting all products:', error);
      return [];
    }
  }

  async getProduct(id) {
    try {
      const [product] = await db.select().from(products).where(eq(products.id, id));
      return product || undefined;
    } catch (error) {
      console.error('Error getting product:', error);
      return undefined;
    }
  }

  async getProductsByCategory(category) {
    try {
      const categoryProducts = await db
        .select()
        .from(products)
        .where(and(eq(products.category, category), eq(products.isActive, true)));
      return categoryProducts;
    } catch (error) {
      console.error('Error getting products by category:', error);
      return [];
    }
  }

  async createProduct(insertProduct) {
    try {
      const [product] = await db
        .insert(products)
        .values(insertProduct)
        .returning();
      
      // Create corresponding inventory entry
      await db.insert(inventory).values({
        productId: product.id,
        stock: insertProduct.stock || 0,
        minStock: 10,
      });
      
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id, updates) {
    try {
      const [product] = await db
        .update(products)
        .set(updates)
        .where(eq(products.id, id))
        .returning();
      
      // Update inventory stock if stock is updated
      if (updates.stock !== undefined) {
        await db
          .update(inventory)
          .set({ 
            stock: updates.stock, 
            lastRestocked: new Date() 
          })
          .where(eq(inventory.productId, id));
      }
      
      return product || undefined;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      const [product] = await db
        .update(products)
        .set({ isActive: false })
        .where(eq(products.id, id))
        .returning();
      return product || undefined;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Product Variant methods
  async getProductVariants(productId) {
    try {
      const variants = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, productId));
      return variants;
    } catch (error) {
      console.error('Error getting product variants:', error);
      return [];
    }
  }

  async createProductVariant(insertVariant) {
    try {
      const [variant] = await db
        .insert(productVariants)
        .values(insertVariant)
        .returning();
      return variant;
    } catch (error) {
      console.error('Error creating product variant:', error);
      throw error;
    }
  }

  async updateProductVariant(id, updates) {
    try {
      const [variant] = await db
        .update(productVariants)
        .set(updates)
        .where(eq(productVariants.id, id))
        .returning();
      return variant || undefined;
    } catch (error) {
      console.error('Error updating product variant:', error);
      throw error;
    }
  }

  // Order methods
  async getAllOrders() {
    try {
      const allOrders = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          items: orders.items,
          totalAmount: orders.totalAmount,
          status: orders.status,
          shippingAddress: orders.shippingAddress,
          paymentMethod: orders.paymentMethod,
          paymentStatus: orders.paymentStatus,
          orderDate: orders.orderDate,
          deliveryDate: orders.deliveryDate,
          username: users.username,
          email: users.email,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .orderBy(sql`${orders.orderDate} DESC`);
      return allOrders;
    } catch (error) {
      console.error('Error getting all orders:', error);
      return [];
    }
  }

  async getOrder(id) {
    try {
      const [order] = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          items: orders.items,
          totalAmount: orders.totalAmount,
          status: orders.status,
          shippingAddress: orders.shippingAddress,
          paymentMethod: orders.paymentMethod,
          paymentStatus: orders.paymentStatus,
          orderDate: orders.orderDate,
          deliveryDate: orders.deliveryDate,
          username: users.username,
          email: users.email,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(eq(orders.id, id));
      return order || undefined;
    } catch (error) {
      console.error('Error getting order:', error);
      return undefined;
    }
  }

  async getOrdersByUser(userId) {
    try {
      const userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(sql`${orders.orderDate} DESC`);
      return userOrders;
    } catch (error) {
      console.error('Error getting orders by user:', error);
      return [];
    }
  }

  async getOrdersByStatus(status) {
    try {
      const statusOrders = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          items: orders.items,
          totalAmount: orders.totalAmount,
          status: orders.status,
          shippingAddress: orders.shippingAddress,
          paymentMethod: orders.paymentMethod,
          paymentStatus: orders.paymentStatus,
          orderDate: orders.orderDate,
          deliveryDate: orders.deliveryDate,
          username: users.username,
          email: users.email,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(eq(orders.status, status))
        .orderBy(sql`${orders.orderDate} DESC`);
      return statusOrders;
    } catch (error) {
      console.error('Error getting orders by status:', error);
      return [];
    }
  }

  async createOrder(insertOrder) {
    try {
      const [order] = await db
        .insert(orders)
        .values(insertOrder)
        .returning();
      
      // Update inventory for ordered items
      for (const item of insertOrder.items) {
        await db
          .update(inventory)
          .set({ 
            stock: sql`${inventory.stock} - ${item.quantity}` 
          })
          .where(eq(inventory.productId, item.productId));
      }
      
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrder(id, updates) {
    try {
      const [order] = await db
        .update(orders)
        .set(updates)
        .where(eq(orders.id, id))
        .returning();
      return order || undefined;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  // Inventory methods
  async getInventory(productId) {
    try {
      const [inventoryItem] = await db
        .select({
          id: inventory.id,
          productId: inventory.productId,
          stock: inventory.stock,
          minStock: inventory.minStock,
          location: inventory.location,
          lastRestocked: inventory.lastRestocked,
          productName: products.name,
          productCategory: products.category,
        })
        .from(inventory)
        .leftJoin(products, eq(inventory.productId, products.id))
        .where(eq(inventory.productId, productId));
      return inventoryItem || undefined;
    } catch (error) {
      console.error('Error getting inventory:', error);
      return undefined;
    }
  }

  async getAllInventory() {
    try {
      const allInventory = await db
        .select({
          id: inventory.id,
          productId: inventory.productId,
          stock: inventory.stock,
          minStock: inventory.minStock,
          location: inventory.location,
          lastRestocked: inventory.lastRestocked,
          productName: products.name,
          productCategory: products.category,
        })
        .from(inventory)
        .leftJoin(products, eq(inventory.productId, products.id));
      return allInventory;
    } catch (error) {
      console.error('Error getting all inventory:', error);
      return [];
    }
  }

  async createInventory(insertInventory) {
    try {
      const [inventoryItem] = await db
        .insert(inventory)
        .values(insertInventory)
        .returning();
      return inventoryItem;
    } catch (error) {
      console.error('Error creating inventory:', error);
      throw error;
    }
  }

  async updateInventory(id, updates) {
    try {
      const [inventoryItem] = await db
        .update(inventory)
        .set(updates)
        .where(eq(inventory.id, id))
        .returning();
      return inventoryItem || undefined;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }

  async getLowStockItems() {
    try {
      const lowStockItems = await db
        .select({
          id: inventory.id,
          productId: inventory.productId,
          stock: inventory.stock,
          minStock: inventory.minStock,
          location: inventory.location,
          lastRestocked: inventory.lastRestocked,
          productName: products.name,
          productCategory: products.category,
        })
        .from(inventory)
        .leftJoin(products, eq(inventory.productId, products.id))
        .where(lte(inventory.stock, inventory.minStock));
      return lowStockItems;
    } catch (error) {
      console.error('Error getting low stock items:', error);
      return [];
    }
  }

  // Analytics methods
  async getOrderAnalytics() {
    try {
      const totalOrders = await db.select({ count: sql`count(*)` }).from(orders);
      const pendingOrders = await db.select({ count: sql`count(*)` }).from(orders).where(eq(orders.status, 'pending'));
      const completedOrders = await db.select({ count: sql`count(*)` }).from(orders).where(eq(orders.status, 'delivered'));
      
      const ordersByStatus = await db
        .select({
          status: orders.status,
          count: sql`count(*)`
        })
        .from(orders)
        .groupBy(orders.status);

      return {
        totalOrders: totalOrders[0]?.count || 0,
        pendingOrders: pendingOrders[0]?.count || 0,
        completedOrders: completedOrders[0]?.count || 0,
        ordersByStatus: ordersByStatus.reduce((acc, curr) => {
          acc[curr.status] = curr.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting order analytics:', error);
      return { totalOrders: 0, pendingOrders: 0, completedOrders: 0, ordersByStatus: {} };
    }
  }

  async getRevenueAnalytics() {
    try {
      const revenueData = await db
        .select({
          year: sql`EXTRACT(year FROM ${orders.orderDate})`,
          month: sql`EXTRACT(month FROM ${orders.orderDate})`,
          totalRevenue: sql`SUM(${orders.totalAmount})`,
          orderCount: sql`count(*)`
        })
        .from(orders)
        .where(sql`${orders.status} IN ('delivered', 'processing')`)
        .groupBy(sql`EXTRACT(year FROM ${orders.orderDate}), EXTRACT(month FROM ${orders.orderDate})`)
        .orderBy(sql`EXTRACT(year FROM ${orders.orderDate}) DESC, EXTRACT(month FROM ${orders.orderDate}) DESC`)
        .limit(12);

      const totalRevenue = await db
        .select({
          total: sql`SUM(${orders.totalAmount})`
        })
        .from(orders)
        .where(sql`${orders.status} IN ('delivered', 'processing')`);

      return {
        monthlyRevenue: revenueData,
        totalRevenue: totalRevenue[0]?.total || 0
      };
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      return { monthlyRevenue: [], totalRevenue: 0 };
    }
  }

  async getCustomerAnalytics() {
    try {
      const totalCustomers = await db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(sql`${users.role} IN ('kirana', 'retail')`);
      
      const activeCustomers = await db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(sql`${users.role} IN ('kirana', 'retail') AND ${users.isActive} = true`);
      
      const customersByRole = await db
        .select({
          role: users.role,
          count: sql`count(*)`
        })
        .from(users)
        .where(sql`${users.role} IN ('kirana', 'retail')`)
        .groupBy(users.role);

      return {
        totalCustomers: totalCustomers[0]?.count || 0,
        activeCustomers: activeCustomers[0]?.count || 0,
        customersByRole: customersByRole.reduce((acc, curr) => {
          acc[curr.role] = curr.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting customer analytics:', error);
      return { totalCustomers: 0, activeCustomers: 0, customersByRole: {} };
    }
  }
}

export const storage = new PostgreSQLStorage();