import mongoose from 'mongoose';
import { z } from 'zod';

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'kirana', 'retail'], 
    required: true 
  },
  isActive: { type: Boolean, default: true },
  phone: String,
  address: String,
  region: String,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
}, {
  timestamps: true
});

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  imageUrl: String,
  category: { type: String, required: true },
  stock: { type: Number, default: 0 },
  price: { type: Number, required: true },
  unit: String,
  isActive: { type: Boolean, default: true },
  tags: [String],
  targetUsers: [{ type: String, enum: ['retail', 'bulk'] }],
}, {
  timestamps: true
});

// Product Variant Schema
const productVariantSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  size: String,
  weight: String,
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  sku: String,
}, {
  timestamps: true
});

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number,
    name: String
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  shippingAddress: String,
  paymentMethod: String,
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed'], 
    default: 'pending' 
  },
  orderDate: { type: Date, default: Date.now },
  deliveryDate: Date,
}, {
  timestamps: true
});

// Inventory Schema
const inventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  stock: { type: Number, required: true },
  minStock: { type: Number, default: 10 },
  location: String,
  lastRestocked: { type: Date, default: Date.now },
}, {
  timestamps: true
});

// Create Models
export const User = mongoose.model('User', userSchema);
export const Product = mongoose.model('Product', productSchema);
export const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);
export const Order = mongoose.model('Order', orderSchema);
export const Inventory = mongoose.model('Inventory', inventorySchema);

// Zod Validation Schemas
export const insertUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'kirana', 'retail']),
  phone: z.string().optional(),
  address: z.string().optional(),
  region: z.string().optional(),
});

export const insertProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  category: z.string().min(1),
  stock: z.number().min(0).default(0),
  price: z.number().min(0),
  unit: z.string().optional(),
  tags: z.array(z.string()).default([]),
  targetUsers: z.array(z.enum(['retail', 'bulk'])).default([]),
});

export const insertProductVariantSchema = z.object({
  productId: z.string(),
  size: z.string().optional(),
  weight: z.string().optional(),
  price: z.number().min(0),
  stock: z.number().min(0).default(0),
  sku: z.string().optional(),
});

export const insertOrderSchema = z.object({
  userId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    name: z.string(),
  })),
  totalAmount: z.number().min(0),
  shippingAddress: z.string().optional(),
  paymentMethod: z.string().optional(),
});

export const insertInventorySchema = z.object({
  productId: z.string(),
  stock: z.number().min(0),
  minStock: z.number().min(0).default(10),
  location: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Type definitions for TypeScript compatibility
export const selectUserType = User;
export const selectProductType = Product;
export const selectOrderType = Order;
export const selectInventoryType = Inventory;