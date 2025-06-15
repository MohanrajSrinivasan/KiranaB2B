import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Header from "@/components/shared/header";
import BulkProductCard from "@/components/kirana/bulk-product-card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  productId: number;
  variantId: number;
  quantity: number;
  label: string;
  price: number;
  productName: string;
  savings?: number;
}

export default function KiranaDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not kirana user
  useEffect(() => {
    if (user && user.role !== 'vendor') {
      const dashboardRoute = user.role === 'admin' ? '/admin' : '/retail';
      setLocation(dashboardRoute);
    } else if (!user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
    enabled: !!user && user.role === 'vendor',
  });

  const { data: orders } = useQuery({
    queryKey: ['/api/orders'],
    enabled: !!user && user.role === 'vendor',
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest('POST', '/api/orders', orderData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bulk order placed successfully!",
        description: "Your bulk order has been submitted and is being processed.",
      });
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: () => {
      toast({
        title: "Order failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!user || user.role !== 'vendor') {
    return null;
  }

  // Filter products for bulk purchases
  const bulkProducts = products?.filter((product: any) => 
    product.targetUsers?.includes('bulk') && 
    product.variants?.some((v: any) => v.bulkPrice)
  ) || [];

  const addToCart = (productId: number, variantId: number, quantity: number, variant: any, productName: string) => {
    const existingItem = cart.find(item => item.productId === productId && item.variantId === variantId);
    const price = parseFloat(variant.bulkPrice || variant.price);
    const regularPrice = parseFloat(variant.price);
    const savings = variant.bulkPrice ? (regularPrice - price) * quantity : 0;
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: item.quantity + quantity, savings: savings * (item.quantity + quantity) / quantity }
          : item
      ));
    } else {
      setCart([...cart, {
        productId,
        variantId,
        quantity,
        label: variant.label,
        price,
        productName,
        savings,
      }]);
    }

    toast({
      title: "Added to cart",
      description: `${quantity} ${variant.label} of ${productName} added to cart`,
    });
  };

  const removeFromCart = (productId: number, variantId: number) => {
    setCart(cart.filter(item => !(item.productId === productId && item.variantId === variantId)));
  };

  const updateCartQuantity = (productId: number, variantId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    setCart(cart.map(item =>
      item.productId === productId && item.variantId === variantId
        ? { ...item, quantity }
        : item
    ));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalSavings = () => {
    return cart.reduce((total, item) => total + (item.savings || 0), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const orderData = {
      totalAmount: getTotalAmount().toString(),
      region: user.region || 'Default',
      status: 'pending',
      items: cart.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        label: item.label,
        unitPrice: item.price,
        productName: item.productName,
        savings: item.savings,
      })),
    };

    createOrderMutation.mutate(orderData);
  };

  const recentOrders = orders?.slice(0, 3) || [];

  // Mock analytics data for store dashboard
  const storeAnalytics = {
    monthlyOrders: orders?.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      const currentDate = new Date();
      return orderDate.getMonth() === currentDate.getMonth() && 
             orderDate.getFullYear() === currentDate.getFullYear();
    }).length || 0,
    monthlySpend: orders?.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      const currentDate = new Date();
      return orderDate.getMonth() === currentDate.getMonth() && 
             orderDate.getFullYear() === currentDate.getFullYear();
    }).reduce((total: number, order: any) => total + parseFloat(order.totalAmount), 0) || 0,
    pendingOrders: orders?.filter((order: any) => order.status === 'pending').length || 0,
    totalSavings: orders?.reduce((total: number, order: any) => {
      const orderSavings = Array.isArray(order.items) ? 
        order.items.reduce((sum: number, item: any) => sum + (item.savings || 0), 0) : 0;
      return total + orderSavings;
    }, 0) || 0,
  };

  return (
    <div className="min-h-screen bg-kiranaconnect-bg">
      <Header user={user} userType="kirana" cartCount={cart.length} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Store Dashboard Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <i className="fas fa-store text-primary"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Orders</p>
                <p className="text-2xl font-bold text-gray-900">{storeAnalytics.monthlyOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-accent/10 rounded-lg">
                <i className="fas fa-rupee-sign text-accent"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Spend</p>
                <p className="text-2xl font-bold text-gray-900">₹{storeAnalytics.monthlySpend.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <i className="fas fa-truck text-yellow-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{storeAnalytics.pendingOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <i className="fas fa-percentage text-green-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold text-gray-900">₹{storeAnalytics.totalSavings.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Bulk Order Cart ({cart.length} items)</h3>
              <div className="text-right">
                <div className="text-xl font-bold text-primary">Total: ₹{getTotalAmount().toFixed(2)}</div>
                {getTotalSavings() > 0 && (
                  <div className="text-sm text-accent">Total Savings: ₹{getTotalSavings().toFixed(2)}</div>
                )}
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {cart.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex justify-between items-center">
                  <span className="text-sm">{item.productName} - {item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="quantity-control">
                      <button onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity - 1)}>-</button>
                      <span className="px-3 py-1 border border-gray-300 rounded text-sm">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}>+</button>
                    </div>
                    <span className="text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                    {item.savings && item.savings > 0 && (
                      <span className="text-xs text-accent">Save ₹{item.savings.toFixed(2)}</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromCart(item.productId, item.variantId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={handleCheckout}
              disabled={createOrderMutation.isPending}
              className="w-full bg-accent text-white hover:bg-accent/90"
            >
              {createOrderMutation.isPending ? 'Processing...' : 'Place Bulk Order'}
            </Button>
          </div>
        )}

        {/* Bulk Product Catalog */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                  <div className="w-full h-40 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))
            ) : (
              bulkProducts.map((product: any) => (
                <BulkProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))
            )}
          </div>
        </div>

        {/* Recent Bulk Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Recent Bulk Orders</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No orders yet. Start ordering bulk products to see your orders here!
              </div>
            ) : (
              recentOrders.map((order: any) => (
                <div key={order.id} className="p-6 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.id}</p>
                        <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {Array.isArray(order.items) ? order.items.length : 0} bulk items • Total: ₹{order.totalAmount}
                      {order.items?.some((item: any) => item.savings) && (
                        <span className="text-accent ml-2">
                          • Saved: ₹{order.items.reduce((sum: number, item: any) => sum + (item.savings || 0), 0).toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Track Order</Button>
                    <Button variant="outline" size="sm">Reorder</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
