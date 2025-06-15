export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'vendor' | 'retail_user';
  shopName?: string;
  region?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  category: string;
  isActive: boolean;
  stock: number;
  tags?: string[];
  targetUsers?: string[];
  createdAt: Date;
  variants?: ProductVariant[];
  inventory?: {
    availableQuantity: number;
    isLowStock: boolean;
  };
}

export interface ProductVariant {
  id: number;
  productId: number;
  label: string;
  price: string;
  bulkPrice?: string;
  minBulkQuantity: number;
  unit: string;
}

export interface Order {
  id: number;
  userId: number;
  userType: 'vendor' | 'retail_user';
  totalAmount: string;
  region?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    name: string;
    email: string;
    shopName?: string;
  };
}

export interface OrderItem {
  productId: number;
  variantId: number;
  quantity: number;
  label: string;
  unitPrice: number;
  productName: string;
  savings?: number;
}

export interface Inventory {
  id: number;
  productId: number;
  availableQuantity: number;
  soldQuantity: number;
  returnedQuantity: number;
  minStockLevel: number;
  lastRestockDate?: Date;
  updatedAt: Date;
  product?: Product;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  activeCustomers: number;
  lowStockItems: number;
}

export interface RevenueData {
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
}
