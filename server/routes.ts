import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  loginSchema, 
  insertOrderSchema,
  insertProductSchema,
  insertProductVariantSchema 
} from "@shared/schema";
import { z } from "zod";
import passport from "passport";
import bcrypt from "bcrypt";
import { whatsappService } from "./whatsapp-service";
import { Server as SocketIOServer } from "socket.io";

// Define user type for passport
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      name: string;
      role: string;
      phone?: string;
      shopName?: string;
      region?: string;
      isActive: boolean;
      createdAt: Date;
    }
  }
}

let io: SocketIOServer;

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", passport.authenticate('local'), (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      req.session = { userId: user.id, userRole: user.role };
      res.status(201).json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session = null;
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    res.json({ user: req.user });
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category } = req.query;
      const products = category 
        ? await storage.getProductsByCategory(category as string)
        : await storage.getAllProducts();
      
      // Get variants for each product
      const productsWithVariants = await Promise.all(
        products.map(async (product) => {
          const variants = await storage.getProductVariants(product.id);
          const inventory = await storage.getInventory(product.id);
          return { 
            ...product, 
            variants,
            inventory: inventory ? {
              availableQuantity: inventory.availableQuantity,
              isLowStock: inventory.availableQuantity <= inventory.minStockLevel
            } : null
          };
        })
      );
      
      res.json(productsWithVariants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const variants = await storage.getProductVariants(id);
      const inventory = await storage.getInventory(id);
      
      res.json({ 
        ...product, 
        variants,
        inventory
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const userRole = req.session?.userRole;
      
      if (!userId || userRole !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const userRole = req.session?.userRole;
      
      if (!userId || userRole !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      const updates = req.body;
      const product = await storage.updateProduct(id, updates);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const userRole = req.session?.userRole;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      let orders;
      if (userRole === 'admin') {
        orders = await storage.getAllOrders();
      } else {
        orders = await storage.getOrdersByUser(userId);
      }
      
      // Get user details for each order
      const ordersWithUserDetails = await Promise.all(
        orders.map(async (order) => {
          const user = await storage.getUser(order.userId);
          return {
            ...order,
            customer: user ? { name: user.name, email: user.email, shopName: user.shopName } : null
          };
        })
      );
      
      res.json(ordersWithUserDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const userRole = req.session?.userRole;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if user has permission to view this order
      if (userRole !== 'admin' && order.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const user = await storage.getUser(order.userId);
      res.json({
        ...order,
        customer: user ? { name: user.name, email: user.email, shopName: user.shopName } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Skip validation and use direct data structure
      const orderData = {
        userId: req.user.id,
        userType: req.user.role === 'vendor' ? 'vendor' : 'retail_user',
        totalAmount: req.body.totalAmount,
        region: req.body.region || null,
        status: 'pending',
        items: req.body.items
      };
      
      const order = await storage.createOrder(orderData);
      
      // Send WhatsApp notification if phone number is available
      if (req.user.phone) {
        try {
          await whatsappService.sendOrderConfirmation(req.user.phone, order);
        } catch (error) {
          console.log('WhatsApp notification failed:', error);
        }
      }
      
      // Emit real-time order update via Socket.io
      if (io) {
        io.emit('orderCreated', { 
          orderId: order.id, 
          userId: req.user.id, 
          userType: req.user.role,
          totalAmount: order.totalAmount 
        });
      }
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(400).json({ 
        message: "Invalid order data",
        error: error.message 
      });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const userRole = req.session?.userRole;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Only admin can update order status, users can only update their own orders
      if (userRole !== 'admin' && order.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updates = req.body;
      const updatedOrder = await storage.updateOrder(id, updates);
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  // Analytics routes (admin only)
  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const userRole = req.session?.userRole;
      
      if (userRole !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const orderAnalytics = await storage.getOrderAnalytics();
      const customerAnalytics = await storage.getCustomerAnalytics();
      const lowStockItems = await storage.getLowStockItems();
      
      res.json({
        totalRevenue: orderAnalytics.totalRevenue,
        totalOrders: orderAnalytics.totalOrders,
        activeCustomers: customerAnalytics.activeCustomers,
        lowStockItems: lowStockItems.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/revenue", async (req, res) => {
    try {
      const userRole = req.session?.userRole;
      
      if (userRole !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const revenueAnalytics = await storage.getRevenueAnalytics();
      res.json(revenueAnalytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch revenue analytics" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const userRole = req.session?.userRole;
      
      if (userRole !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const inventory = await storage.getAllInventory();
      
      // Get product details for each inventory item
      const inventoryWithProducts = await Promise.all(
        inventory.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return { ...item, product };
        })
      );
      
      res.json(inventoryWithProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const userRole = req.session?.userRole;
      
      if (userRole !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const lowStockItems = await storage.getLowStockItems();
      
      // Get product details for each low stock item
      const lowStockWithProducts = await Promise.all(
        lowStockItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return { ...item, product };
        })
      );
      
      res.json(lowStockWithProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize Socket.io server
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : "*",
      credentials: true
    },
    path: '/ws'
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });
    
    socket.on('join-admin-room', () => {
      socket.join('admin-room');
      console.log('User joined admin room');
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return httpServer;
}
