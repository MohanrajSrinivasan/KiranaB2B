import { createServer } from 'http';
import { storage } from './storage.js';

async function registerRoutes(app) {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user session
      req.session.userId = user.id;
      req.session.userRole = user.role;
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = req.body;
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      req.session.userId = user.id;
      req.session.userRole = user.role;
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
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ user: { ...user, password: undefined } });
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category } = req.query;
      const products = category 
        ? await storage.getProductsByCategory(category)
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
              availableQuantity: inventory.availableQuantity || 0,
              isLowStock: (inventory.availableQuantity || 0) <= (inventory.minStockLevel || 10)
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
      
      const productData = req.body;
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
      const userId = req.session?.userId;
      const userRole = req.session?.userRole;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const orderData = {
        ...req.body,
        userId,
        userType: userRole === 'vendor' ? 'vendor' : 'retail_user'
      };
      
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
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
  return httpServer;
}

export { registerRoutes };