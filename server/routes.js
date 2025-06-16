import { createServer } from "http";
import { z } from "zod";
import passport from "passport";
import bcrypt from "bcrypt";
import { whatsappService } from "./whatsapp-service.js";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./mongodb-storage.js";
import { insertUserSchema, insertProductSchema, insertOrderSchema, loginSchema } from "@shared/mongodb-schema.js";
import mongoose from "mongoose";

let io;

export async function registerRoutes(app) {
  // Authentication routes
  app.post("/api/auth/login", passport.authenticate('local'), (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Session destruction failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, phone, role, shopName, region } = req.body;
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: role || 'retail_user',
        shopName: shopName || null,
        region: region || null,
        isActive: true
      });

      res.status(201).json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      
      // Get variants for each product
      const productsWithVariants = await Promise.all(
        products.map(async (product) => {
          const variants = await storage.getProductVariants(product.id);
          
          // Get inventory for low stock checking
          const inventory = await storage.getInventory(product.id);
          const isLowStock = inventory && inventory.availableQuantity !== null && inventory.minStockLevel !== null ? 
            inventory.availableQuantity <= inventory.minStockLevel : false;
          
          return {
            ...product,
            variants,
            isLowStock
          };
        })
      );
      
      res.json(productsWithVariants);
    } catch (error) {
      console.error("Products fetch error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProduct(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const variants = await storage.getProductVariants(product._id || product.id);
      res.json({ ...product, variants });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Product variants routes
  app.post("/api/products/:productId/variants", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const variant = await storage.createProductVariant({
        ...req.body,
        productId: req.params.productId
      });
      res.status(201).json(variant);
    } catch (error) {
      res.status(400).json({ message: "Failed to create variant" });
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      let orders;
      if (req.user.role === 'admin') {
        orders = await storage.getAllOrders();
      } else {
        orders = await storage.getOrdersByUser(req.user._id || req.user.id);
      }
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const order = await storage.getOrder(parseInt(req.params.id));
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if user can access this order
      if (req.user.role !== 'admin' && order.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
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
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Only admin or order owner can update
      if (req.user.role !== 'admin' && order.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedOrder = await storage.updateOrder(parseInt(req.params.id), req.body);
      
      // Send WhatsApp status update if status changed
      if (req.body.status && req.user.phone) {
        try {
          await whatsappService.sendOrderStatusUpdate(req.user.phone, updatedOrder);
        } catch (error) {
          console.log('WhatsApp status update failed:', error);
        }
      }
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "Failed to update order" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const inventory = await storage.getAllInventory();
      
      // Get product details for each inventory item
      const inventoryWithProducts = await Promise.all(
        inventory.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return {
            ...item,
            product
          };
        })
      );
      
      res.json(inventoryWithProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/low-stock", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const lowStockItems = await storage.getLowStockItems();
      
      // Get product details for each low stock item
      const lowStockWithProducts = await Promise.all(
        lowStockItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return {
            ...item,
            product
          };
        })
      );
      
      res.json(lowStockWithProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const [orderAnalytics, revenueAnalytics, customerAnalytics] = await Promise.all([
        storage.getOrderAnalytics(),
        storage.getRevenueAnalytics(),
        storage.getCustomerAnalytics()
      ]);

      // Get low stock count
      const lowStockItems = await storage.getLowStockItems();
      
      // Get top products (mock data for now)
      const topProducts = [
        { name: "Basmati Rice", sales: 45, revenue: 2250 },
        { name: "Wheat Flour", sales: 38, revenue: 1520 },
        { name: "Sugar", sales: 32, revenue: 1280 },
        { name: "Cooking Oil", sales: 28, revenue: 1680 },
        { name: "Dal", sales: 25, revenue: 1875 }
      ];

      const analytics = {
        orderAnalytics: {
          totalOrders: orderAnalytics.totalOrders || 0,
          totalRevenue: parseFloat(orderAnalytics.totalRevenue) || 0,
          averageOrderValue: orderAnalytics.totalOrders > 0 ? 
            (parseFloat(orderAnalytics.totalRevenue) / orderAnalytics.totalOrders) : 0,
          orderGrowth: 15.2, // Mock growth percentage
          monthlyData: [
            { month: "Jan", orders: 12, revenue: 5200 },
            { month: "Feb", orders: 18, revenue: 7300 },
            { month: "Mar", orders: 25, revenue: 9100 },
            { month: "Apr", orders: 32, revenue: 12400 },
            { month: "May", orders: 28, revenue: 11200 },
            { month: "Jun", orders: 35, revenue: 14800 }
          ]
        },
        customerAnalytics: {
          totalCustomers: customerAnalytics.totalCustomers || 0,
          activeCustomers: Math.floor((customerAnalytics.totalCustomers || 0) * 0.7),
          customerGrowth: 8.5, // Mock growth percentage
          regionDistribution: [
            { region: "Mumbai", customers: 15 },
            { region: "Delhi", customers: 12 },
            { region: "Bangalore", customers: 8 },
            { region: "Chennai", customers: 6 },
            { region: "Kolkata", customers: 4 }
          ]
        },
        productAnalytics: {
          totalProducts: (await storage.getAllProducts()).length,
          lowStockCount: lowStockItems.length,
          topProducts
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
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