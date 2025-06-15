import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Header from "@/components/shared/header";
import ProductCard from "@/components/retail/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  productId: number;
  variantId: number;
  quantity: number;
  label: string;
  price: number;
  productName: string;
}

export default function RetailDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not retail user
  useEffect(() => {
    if (user && user.role !== 'retail_user') {
      const dashboardRoute = user.role === 'admin' ? '/admin' : '/kirana';
      setLocation(dashboardRoute);
    } else if (!user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
    enabled: !!user && user.role === 'retail_user',
  });

  const { data: orders } = useQuery({
    queryKey: ['/api/orders'],
    enabled: !!user && user.role === 'retail_user',
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest('POST', '/api/orders', orderData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order placed successfully!",
        description: "Your order has been submitted and is being processed.",
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

  if (!user || user.role !== 'retail_user') {
    return null;
  }

  const filteredProducts = products?.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const isRetailProduct = product.targetUsers?.includes('retail');
    return matchesSearch && matchesCategory && isRetailProduct;
  }) || [];

  const categories = [...new Set(products?.map((p: any) => p.category) || [])];

  const addToCart = (productId: number, variantId: number, quantity: number, variant: any, productName: string) => {
    const existingItem = cart.find(item => item.productId === productId && item.variantId === variantId);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, {
        productId,
        variantId,
        quantity,
        label: variant.label,
        price: parseFloat(variant.price),
        productName,
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
      })),
    };

    createOrderMutation.mutate(orderData);
  };

  const recentOrders = orders?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-kiranaconnect-bg">
      <Header user={user} userType="retail" cartCount={cart.length} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search for products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="bg-primary text-white hover:bg-primary/90">
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Shopping Cart ({cart.length} items)</h3>
              <div className="text-xl font-bold text-primary">Total: ₹{getTotalAmount().toFixed(2)}</div>
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
              {createOrderMutation.isPending ? 'Processing...' : 'Place Order'}
            </Button>
          </div>
        )}

        {/* Product Catalog */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {productsLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                <div className="w-full h-40 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : (
            filteredProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))
          )}
        </div>

        {/* Recent Orders Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No orders yet. Start shopping to see your orders here!
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
                      {Array.isArray(order.items) ? order.items.length : 0} items • Total: ₹{order.totalAmount}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
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
