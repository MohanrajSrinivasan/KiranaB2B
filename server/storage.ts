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
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Product variant operations
  getProductVariants(productId: number): Promise<ProductVariant[]>;
  createProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  updateProductVariant(id: number, updates: Partial<ProductVariant>): Promise<ProductVariant | undefined>;
  
  // Order operations
  getAllOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined>;
  
  // Inventory operations
  getInventory(productId: number): Promise<Inventory | undefined>;
  getAllInventory(): Promise<Inventory[]>;
  createInventory(inventory: InsertInventory): Promise<Inventory>;
  updateInventory(id: number, updates: Partial<Inventory>): Promise<Inventory | undefined>;
  getLowStockItems(): Promise<Inventory[]>;
  
  // Analytics operations
  getOrderAnalytics(): Promise<any>;
  getRevenueAnalytics(): Promise<any>;
  getCustomerAnalytics(): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private productVariants: Map<number, ProductVariant>;
  private orders: Map<number, Order>;
  private inventory: Map<number, Inventory>;
  private currentUserId: number;
  private currentProductId: number;
  private currentVariantId: number;
  private currentOrderId: number;
  private currentInventoryId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.productVariants = new Map();
    this.orders = new Map();
    this.inventory = new Map();
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentVariantId = 1;
    this.currentOrderId = 1;
    this.currentInventoryId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Create admin user
    const admin: User = {
      id: this.currentUserId++,
      name: "Admin User",
      email: "admin@kiranaconnect.com",
      password: "admin123",
      phone: "+91 98765 43210",
      role: "admin",
      shopName: null,
      region: "Chennai",
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(admin.id, admin);

    // Create demo users
    const vendor: User = {
      id: this.currentUserId++,
      name: "Ravi Kumar",
      email: "vendor@example.com",
      password: "vendor123",
      phone: "+91 98765 12345",
      role: "vendor",
      shopName: "Ravi General Store",
      region: "Chennai",
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(vendor.id, vendor);

    const retail: User = {
      id: this.currentUserId++,
      name: "Priya Sharma",
      email: "retail@example.com",
      password: "retail123",
      phone: "+91 98765 67890",
      role: "retail_user",
      shopName: null,
      region: "Chennai",
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(retail.id, retail);

    // Create sample products
    const products = [
      {
        id: this.currentProductId++,
        name: "Basmati Rice",
        description: "Premium quality long grain rice",
        imageUrl: "https://pixabay.com/get/gb91a1c039c20a4d546eaa638e71bf9608efd6b8df33102e87c3c0a3dea22c4f8cdb39fe8f38264c275f2b1ff54351e5ced58d1d917941675ae48d3c611658e83_1280.jpg",
        category: "Rice & Grains",
        isActive: true,
        stock: 250,
        tags: ["rice", "basmati", "premium"],
        targetUsers: ["retail", "bulk"],
        createdAt: new Date(),
      },
      {
        id: this.currentProductId++,
        name: "Wheat Flour (Atta)",
        description: "Fresh ground whole wheat flour",
        imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        category: "Flour & Grains",
        isActive: true,
        stock: 15,
        tags: ["flour", "wheat", "atta"],
        targetUsers: ["retail", "bulk"],
        createdAt: new Date(),
      },
      {
        id: this.currentProductId++,
        name: "Garam Masala",
        description: "Authentic blend of spices",
        imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
        category: "Spices",
        isActive: true,
        stock: 80,
        tags: ["spices", "masala", "blend"],
        targetUsers: ["retail"],
        createdAt: new Date(),
      },
      {
        id: this.currentProductId++,
        name: "Mixed Lentils (Dal)",
        description: "Assorted pulses and lentils pack",
        imageUrl: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
        category: "Lentils & Pulses",
        isActive: true,
        stock: 180,
        tags: ["lentils", "dal", "pulses"],
        targetUsers: ["retail", "bulk"],
        createdAt: new Date(),
      }
    ];

    products.forEach(product => this.products.set(product.id, product));

    // Create product variants
    const variants = [
      { id: this.currentVariantId++, productId: 1, label: "1kg", price: "85.00", bulkPrice: "82.00", minBulkQuantity: 25, unit: "kg" },
      { id: this.currentVariantId++, productId: 1, label: "25kg sack", price: "2050.00", bulkPrice: "1950.00", minBulkQuantity: 1, unit: "sack" },
      { id: this.currentVariantId++, productId: 2, label: "1kg", price: "45.00", bulkPrice: "44.00", minBulkQuantity: 50, unit: "kg" },
      { id: this.currentVariantId++, productId: 2, label: "50kg sack", price: "2200.00", bulkPrice: "2100.00", minBulkQuantity: 1, unit: "sack" },
      { id: this.currentVariantId++, productId: 3, label: "500g", price: "280.00", bulkPrice: null, minBulkQuantity: 1, unit: "pack" },
      { id: this.currentVariantId++, productId: 4, label: "1kg", price: "120.00", bulkPrice: "117.50", minBulkQuantity: 20, unit: "kg" },
      { id: this.currentVariantId++, productId: 4, label: "20kg pack", price: "2350.00", bulkPrice: "2200.00", minBulkQuantity: 1, unit: "pack" },
    ];

    variants.forEach(variant => this.productVariants.set(variant.id, variant));

    // Create inventory records
    products.forEach(product => {
      const inventoryItem: Inventory = {
        id: this.currentInventoryId++,
        productId: product.id,
        availableQuantity: product.stock,
        soldQuantity: Math.floor(Math.random() * 50),
        returnedQuantity: Math.floor(Math.random() * 5),
        minStockLevel: product.stock < 20 ? 10 : 25,
        lastRestockDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      };
      this.inventory.set(inventoryItem.id, inventoryItem);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.isActive);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.category === category && p.isActive);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const product: Product = {
      ...insertProduct,
      id: this.currentProductId++,
      createdAt: new Date(),
    };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Product variant operations
  async getProductVariants(productId: number): Promise<ProductVariant[]> {
    return Array.from(this.productVariants.values()).filter(v => v.productId === productId);
  }

  async createProductVariant(insertVariant: InsertProductVariant): Promise<ProductVariant> {
    const variant: ProductVariant = {
      ...insertVariant,
      id: this.currentVariantId++,
    };
    this.productVariants.set(variant.id, variant);
    return variant;
  }

  async updateProductVariant(id: number, updates: Partial<ProductVariant>): Promise<ProductVariant | undefined> {
    const variant = this.productVariants.get(id);
    if (!variant) return undefined;
    
    const updatedVariant = { ...variant, ...updates };
    this.productVariants.set(id, updatedVariant);
    return updatedVariant;
  }

  // Order operations
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.userId === userId);
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.status === status);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const order: Order = {
      ...insertOrder,
      id: this.currentOrderId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(order.id, order);
    return order;
  }

  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, ...updates, updatedAt: new Date() };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Inventory operations
  async getInventory(productId: number): Promise<Inventory | undefined> {
    return Array.from(this.inventory.values()).find(i => i.productId === productId);
  }

  async getAllInventory(): Promise<Inventory[]> {
    return Array.from(this.inventory.values());
  }

  async createInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const inventory: Inventory = {
      ...insertInventory,
      id: this.currentInventoryId++,
      updatedAt: new Date(),
    };
    this.inventory.set(inventory.id, inventory);
    return inventory;
  }

  async updateInventory(id: number, updates: Partial<Inventory>): Promise<Inventory | undefined> {
    const inventory = this.inventory.get(id);
    if (!inventory) return undefined;
    
    const updatedInventory = { ...inventory, ...updates, updatedAt: new Date() };
    this.inventory.set(id, updatedInventory);
    return updatedInventory;
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(i => i.availableQuantity <= i.minStockLevel);
  }

  // Analytics operations
  async getOrderAnalytics(): Promise<any> {
    const orders = Array.from(this.orders.values());
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const kiranOrders = orders.filter(o => o.userType === 'vendor').length;
    const retailOrders = orders.filter(o => o.userType === 'retail_user').length;

    return {
      totalOrders,
      totalRevenue,
      kiranOrders,
      retailOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  }

  async getRevenueAnalytics(): Promise<any> {
    const orders = Array.from(this.orders.values());
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear();
      });
      const revenue = monthOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
      last6Months.push({ month: monthName, revenue });
    }

    return { monthlyRevenue: last6Months };
  }

  async getCustomerAnalytics(): Promise<any> {
    const users = Array.from(this.users.values());
    const activeCustomers = users.filter(u => u.isActive && u.role !== 'admin').length;
    const kiranVendors = users.filter(u => u.role === 'vendor').length;
    const retailCustomers = users.filter(u => u.role === 'retail_user').length;

    return {
      activeCustomers,
      kiranVendors,
      retailCustomers,
    };
  }
}

import { DatabaseStorage } from "./database-storage";

export const storage = new DatabaseStorage();
