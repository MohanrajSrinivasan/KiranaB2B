import { connectToMongoDB } from "./mongodb.js";
import { storage as memStorage } from "./storage.js";
import { User, Product, ProductVariant, Order, Inventory } from "@shared/mongodb-schema.js";

class HybridStorage {
  constructor() {
    this.mongoAvailable = false;
    this.initializeConnection();
  }

  async initializeConnection() {
    try {
      await connectToMongoDB();
      this.mongoAvailable = true;
      console.log('Using MongoDB for data storage');
    } catch (error) {
      console.log('MongoDB unavailable, using in-memory storage');
      this.mongoAvailable = false;
    }
  }

  // User methods
  async getUser(id) {
    if (this.mongoAvailable) {
      try {
        const user = await User.findById(id);
        return user ? user.toObject() : undefined;
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getUser(id);
  }

  async getUserByEmail(email) {
    if (this.mongoAvailable) {
      try {
        const user = await User.findOne({ email });
        return user ? user.toObject() : undefined;
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getUserByEmail(email);
  }

  async createUser(insertUser) {
    if (this.mongoAvailable) {
      try {
        const user = new User(insertUser);
        const savedUser = await user.save();
        return savedUser.toObject();
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.createUser(insertUser);
  }

  async updateUser(id, updates) {
    if (this.mongoAvailable) {
      try {
        const user = await User.findByIdAndUpdate(id, updates, { new: true });
        return user ? user.toObject() : undefined;
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.updateUser(id, updates);
  }

  // Product methods
  async getAllProducts() {
    if (this.mongoAvailable) {
      try {
        const products = await Product.find({ isActive: true });
        return products.map(p => p.toObject());
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getAllProducts();
  }

  async getProduct(id) {
    if (this.mongoAvailable) {
      try {
        const product = await Product.findById(id);
        return product ? product.toObject() : undefined;
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getProduct(id);
  }

  async getProductsByCategory(category) {
    if (this.mongoAvailable) {
      try {
        const products = await Product.find({ category, isActive: true });
        return products.map(p => p.toObject());
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getProductsByCategory(category);
  }

  async createProduct(insertProduct) {
    if (this.mongoAvailable) {
      try {
        const product = new Product(insertProduct);
        const savedProduct = await product.save();
        
        // Create corresponding inventory
        const inventory = new Inventory({
          productId: savedProduct._id,
          stock: insertProduct.stock || 0,
          minStock: 10,
        });
        await inventory.save();
        
        return savedProduct.toObject();
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.createProduct(insertProduct);
  }

  async updateProduct(id, updates) {
    if (this.mongoAvailable) {
      try {
        const product = await Product.findByIdAndUpdate(id, updates, { new: true });
        
        if (updates.stock !== undefined) {
          await Inventory.findOneAndUpdate(
            { productId: id },
            { stock: updates.stock, lastRestocked: new Date() }
          );
        }
        
        return product ? product.toObject() : undefined;
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.updateProduct(id, updates);
  }

  async deleteProduct(id) {
    if (this.mongoAvailable) {
      try {
        const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
        return product ? product.toObject() : undefined;
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.deleteProduct(id);
  }

  // Order methods
  async getAllOrders() {
    if (this.mongoAvailable) {
      try {
        const orders = await Order.find().populate('userId', 'username email').sort({ orderDate: -1 });
        return orders.map(o => o.toObject());
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getAllOrders();
  }

  async getOrder(id) {
    if (this.mongoAvailable) {
      try {
        const order = await Order.findById(id).populate('userId', 'username email');
        return order ? order.toObject() : undefined;
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getOrder(id);
  }

  async getOrdersByUser(userId) {
    if (this.mongoAvailable) {
      try {
        const orders = await Order.find({ userId }).sort({ orderDate: -1 });
        return orders.map(o => o.toObject());
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getOrdersByUser(userId);
  }

  async getOrdersByStatus(status) {
    if (this.mongoAvailable) {
      try {
        const orders = await Order.find({ status }).populate('userId', 'username email').sort({ orderDate: -1 });
        return orders.map(o => o.toObject());
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getOrdersByStatus(status);
  }

  async createOrder(insertOrder) {
    if (this.mongoAvailable) {
      try {
        const order = new Order(insertOrder);
        const savedOrder = await order.save();
        
        // Update inventory
        for (const item of insertOrder.items) {
          await Inventory.findOneAndUpdate(
            { productId: item.productId },
            { $inc: { stock: -item.quantity } }
          );
        }
        
        return savedOrder.toObject();
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.createOrder(insertOrder);
  }

  async updateOrder(id, updates) {
    if (this.mongoAvailable) {
      try {
        const order = await Order.findByIdAndUpdate(id, updates, { new: true });
        return order ? order.toObject() : undefined;
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.updateOrder(id, updates);
  }

  // Inventory methods
  async getInventory(productId) {
    if (this.mongoAvailable) {
      try {
        const inventory = await Inventory.findOne({ productId }).populate('productId', 'name category');
        return inventory ? inventory.toObject() : undefined;
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getInventory(productId);
  }

  async getAllInventory() {
    if (this.mongoAvailable) {
      try {
        const inventory = await Inventory.find().populate('productId', 'name category');
        return inventory.map(i => i.toObject());
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getAllInventory();
  }

  async createInventory(insertInventory) {
    if (this.mongoAvailable) {
      try {
        const inventory = new Inventory(insertInventory);
        const savedInventory = await inventory.save();
        return savedInventory.toObject();
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.createInventory(insertInventory);
  }

  async updateInventory(id, updates) {
    if (this.mongoAvailable) {
      try {
        const inventory = await Inventory.findByIdAndUpdate(id, updates, { new: true });
        return inventory ? inventory.toObject() : undefined;
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.updateInventory(id, updates);
  }

  async getLowStockItems() {
    if (this.mongoAvailable) {
      try {
        const lowStockItems = await Inventory.find({
          $expr: { $lte: ["$stock", "$minStock"] }
        }).populate('productId', 'name category');
        return lowStockItems.map(i => i.toObject());
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getLowStockItems();
  }

  // Analytics methods
  async getOrderAnalytics() {
    if (this.mongoAvailable) {
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
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getOrderAnalytics();
  }

  async getRevenueAnalytics() {
    if (this.mongoAvailable) {
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
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getRevenueAnalytics();
  }

  async getCustomerAnalytics() {
    if (this.mongoAvailable) {
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
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getCustomerAnalytics();
  }

  // Product Variant methods
  async getProductVariants(productId) {
    if (this.mongoAvailable) {
      try {
        const variants = await ProductVariant.find({ productId });
        return variants.map(v => v.toObject());
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.getProductVariants(productId);
  }

  async createProductVariant(insertVariant) {
    if (this.mongoAvailable) {
      try {
        const variant = new ProductVariant(insertVariant);
        const savedVariant = await variant.save();
        return savedVariant.toObject();
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.createProductVariant(insertVariant);
  }

  async updateProductVariant(id, updates) {
    if (this.mongoAvailable) {
      try {
        const variant = await ProductVariant.findByIdAndUpdate(id, updates, { new: true });
        return variant ? variant.toObject() : undefined;
      } catch (error) {
        console.error('MongoDB error, falling back:', error.message);
        this.mongoAvailable = false;
      }
    }
    return memStorage.updateProductVariant(id, updates);
  }
}

export const storage = new HybridStorage();