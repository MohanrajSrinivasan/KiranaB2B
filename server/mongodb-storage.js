import { User, Product, ProductVariant, Order, Inventory } from "@shared/mongodb-schema";
import { connectToMongoDB } from "./mongodb";
import bcrypt from "bcrypt";

class MongoStorage {
  constructor() {
    this.initializeConnection();
  }

  async initializeConnection() {
    try {
      await connectToMongoDB();
    } catch (error) {
      console.error('MongoDB connection failed, using fallback storage');
      // Initialize fallback behavior
    }
  }

  // User methods
  async getUser(id) {
    try {
      const user = await User.findById(id);
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email });
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(insertUser) {
    try {
      const hashedPassword = await bcrypt.hash(insertUser.password, 10);
      const user = new User({
        ...insertUser,
        password: hashedPassword,
      });
      const savedUser = await user.save();
      return savedUser.toObject();
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
      const user = await User.findByIdAndUpdate(id, updates, { new: true });
      return user ? user.toObject() : undefined;
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
      const products = await Product.find({ isActive: true });
      return products.map(p => p.toObject());
    } catch (error) {
      console.error('Error getting all products:', error);
      return [];
    }
  }

  async getProduct(id) {
    try {
      const product = await Product.findById(id);
      return product ? product.toObject() : undefined;
    } catch (error) {
      console.error('Error getting product:', error);
      return undefined;
    }
  }

  async getProductsByCategory(category) {
    try {
      const products = await Product.find({ category, isActive: true });
      return products.map(p => p.toObject());
    } catch (error) {
      console.error('Error getting products by category:', error);
      return [];
    }
  }

  async createProduct(insertProduct) {
    try {
      const product = new Product(insertProduct);
      const savedProduct = await product.save();
      
      // Create corresponding inventory entry
      await this.createInventory({
        productId: savedProduct._id.toString(),
        stock: insertProduct.stock || 0,
        minStock: 10,
      });
      
      return savedProduct.toObject();
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id, updates) {
    try {
      const product = await Product.findByIdAndUpdate(id, updates, { new: true });
      
      // Update inventory stock if stock is updated
      if (updates.stock !== undefined) {
        await Inventory.findOneAndUpdate(
          { productId: id },
          { stock: updates.stock, lastRestocked: new Date() }
        );
      }
      
      return product ? product.toObject() : undefined;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
      return product ? product.toObject() : undefined;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Product Variant methods
  async getProductVariants(productId) {
    try {
      const variants = await ProductVariant.find({ productId });
      return variants.map(v => v.toObject());
    } catch (error) {
      console.error('Error getting product variants:', error);
      return [];
    }
  }

  async createProductVariant(insertVariant) {
    try {
      const variant = new ProductVariant(insertVariant);
      const savedVariant = await variant.save();
      return savedVariant.toObject();
    } catch (error) {
      console.error('Error creating product variant:', error);
      throw error;
    }
  }

  async updateProductVariant(id, updates) {
    try {
      const variant = await ProductVariant.findByIdAndUpdate(id, updates, { new: true });
      return variant ? variant.toObject() : undefined;
    } catch (error) {
      console.error('Error updating product variant:', error);
      throw error;
    }
  }

  // Order methods
  async getAllOrders() {
    try {
      const orders = await Order.find().populate('userId', 'username email').sort({ orderDate: -1 });
      return orders.map(o => o.toObject());
    } catch (error) {
      console.error('Error getting all orders:', error);
      return [];
    }
  }

  async getOrder(id) {
    try {
      const order = await Order.findById(id).populate('userId', 'username email');
      return order ? order.toObject() : undefined;
    } catch (error) {
      console.error('Error getting order:', error);
      return undefined;
    }
  }

  async getOrdersByUser(userId) {
    try {
      const orders = await Order.find({ userId }).sort({ orderDate: -1 });
      return orders.map(o => o.toObject());
    } catch (error) {
      console.error('Error getting orders by user:', error);
      return [];
    }
  }

  async getOrdersByStatus(status) {
    try {
      const orders = await Order.find({ status }).populate('userId', 'username email').sort({ orderDate: -1 });
      return orders.map(o => o.toObject());
    } catch (error) {
      console.error('Error getting orders by status:', error);
      return [];
    }
  }

  async createOrder(insertOrder) {
    try {
      const order = new Order(insertOrder);
      const savedOrder = await order.save();
      
      // Update inventory for ordered items
      for (const item of insertOrder.items) {
        await Inventory.findOneAndUpdate(
          { productId: item.productId },
          { $inc: { stock: -item.quantity } }
        );
      }
      
      return savedOrder.toObject();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrder(id, updates) {
    try {
      const order = await Order.findByIdAndUpdate(id, updates, { new: true });
      return order ? order.toObject() : undefined;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  // Inventory methods
  async getInventory(productId) {
    try {
      const inventory = await Inventory.findOne({ productId }).populate('productId', 'name category');
      return inventory ? inventory.toObject() : undefined;
    } catch (error) {
      console.error('Error getting inventory:', error);
      return undefined;
    }
  }

  async getAllInventory() {
    try {
      const inventory = await Inventory.find().populate('productId', 'name category');
      return inventory.map(i => i.toObject());
    } catch (error) {
      console.error('Error getting all inventory:', error);
      return [];
    }
  }

  async createInventory(insertInventory) {
    try {
      const inventory = new Inventory(insertInventory);
      const savedInventory = await inventory.save();
      return savedInventory.toObject();
    } catch (error) {
      console.error('Error creating inventory:', error);
      throw error;
    }
  }

  async updateInventory(id, updates) {
    try {
      const inventory = await Inventory.findByIdAndUpdate(id, updates, { new: true });
      return inventory ? inventory.toObject() : undefined;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }

  async getLowStockItems() {
    try {
      const lowStockItems = await Inventory.find({
        $expr: { $lte: ["$stock", "$minStock"] }
      }).populate('productId', 'name category');
      return lowStockItems.map(i => i.toObject());
    } catch (error) {
      console.error('Error getting low stock items:', error);
      return [];
    }
  }

  // Analytics methods
  async getOrderAnalytics() {
    try {
      const totalOrders = await Order.countDocuments();
      const pendingOrders = await Order.countDocuments({ status: 'pending' });
      const completedOrders = await Order.countDocuments({ status: 'delivered' });
      
      const ordersByStatus = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      return {
        totalOrders,
        pendingOrders,
        completedOrders,
        ordersByStatus: ordersByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
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
      const revenueData = await Order.aggregate([
        { $match: { status: { $in: ['delivered', 'processing'] } } },
        {
          $group: {
            _id: {
              year: { $year: '$orderDate' },
              month: { $month: '$orderDate' }
            },
            totalRevenue: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);

      const totalRevenue = await Order.aggregate([
        { $match: { status: { $in: ['delivered', 'processing'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

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
      const totalCustomers = await User.countDocuments({ role: { $in: ['kirana', 'retail'] } });
      const activeCustomers = await User.countDocuments({ 
        role: { $in: ['kirana', 'retail'] }, 
        isActive: true 
      });
      
      const customersByRole = await User.aggregate([
        { $match: { role: { $in: ['kirana', 'retail'] } } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      return {
        totalCustomers,
        activeCustomers,
        customersByRole: customersByRole.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting customer analytics:', error);
      return { totalCustomers: 0, activeCustomers: 0, customersByRole: {} };
    }
  }
}

export const storage = new MongoStorage();