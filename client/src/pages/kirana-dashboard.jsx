import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useRealTimeOrders } from '@/hooks/use-socket';
import { Package, ShoppingCart, TrendingUp, Clock } from 'lucide-react';

export default function KiranaDashboard() {
  const { user, setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cart, setCart] = useState([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const realtimeOrders = useRealTimeOrders();

  // Redirect if not vendor
  if (!user || user.role !== 'vendor') {
    setLocation('/');
    return null;
  }

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => apiRequest('POST', '/api/orders', orderData),
    onSuccess: () => {
      toast({
        title: 'Order Placed Successfully',
        description: 'Your bulk order has been submitted. You will receive WhatsApp confirmation.'
      });
      setCart([]);
      setIsPlacingOrder(false);
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: (error) => {
      toast({
        title: 'Order Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/auth/logout'),
    onSuccess: () => {
      setUser(null);
      setLocation('/');
      toast({
        title: 'Logged out successfully'
      });
    }
  });

  const addToCart = (product, variant, quantity) => {
    const existingItem = cart.find(item => 
      item.productId === product.id && item.variantId === variant.id
    );

    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id && item.variantId === variant.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        label: variant.label,
        price: parseFloat(variant.bulkPrice || variant.price),
        quantity,
        unit: variant.unit
      }]);
    }

    toast({
      title: 'Added to Cart',
      description: `${quantity} ${variant.label} ${product.name} added`
    });
  };

  const removeFromCart = (productId, variantId) => {
    setCart(cart.filter(item => 
      !(item.productId === productId && item.variantId === variantId)
    ));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart Empty',
        description: 'Please add items to cart before placing order',
        variant: 'destructive'
      });
      return;
    }

    const orderData = {
      totalAmount: getTotalAmount().toString(),
      region: user.region,
      items: cart
    };

    createOrderMutation.mutate(orderData);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Kirana Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {user.shopName} - {user.region}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                Cart: {cart.length} items
              </Badge>
              <Button
                onClick={handleLogout}
                variant="outline"
                disabled={logoutMutation.isPending}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Lifetime orders placed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cart Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{getTotalAmount().toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Current cart total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {products?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Products in catalog
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Order Updates */}
        {realtimeOrders.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Order Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {realtimeOrders.slice(0, 3).map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm">New order placed</span>
                    <Badge variant="secondary">₹{order.totalAmount}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Browse Products</TabsTrigger>
            <TabsTrigger value="cart">Cart ({cart.length})</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products?.filter(product => 
                product.targetUsers?.includes('vendor') && product.isActive
              ).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cart">
            <Card>
              <CardHeader>
                <CardTitle>Shopping Cart</CardTitle>
                <CardDescription>Review your bulk order before placing</CardDescription>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Your cart is empty. Add products from the catalog.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-gray-600">
                            {item.label} - ₹{item.price} per {item.unit}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-medium">
                            {item.quantity} × ₹{item.price} = ₹{(item.quantity * item.price).toLocaleString()}
                          </span>
                          <Button
                            onClick={() => removeFromCart(item.productId, item.variantId)}
                            variant="destructive"
                            size="sm"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold">Total: ₹{getTotalAmount().toLocaleString()}</span>
                      </div>
                      
                      <Button
                        onClick={handlePlaceOrder}
                        disabled={createOrderMutation.isPending || cart.length === 0}
                        className="w-full"
                        size="lg"
                      >
                        {createOrderMutation.isPending ? 'Placing Order...' : 'Place Bulk Order'}
                      </Button>
                      
                      <p className="text-sm text-gray-600 mt-2 text-center">
                        You will receive WhatsApp confirmation upon order placement
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>Track your previous orders</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : orders?.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No orders yet. Place your first bulk order!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {orders?.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{order.totalAmount}</p>
                          <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProductCard({ product, onAddToCart }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);
  const [quantity, setQuantity] = useState(selectedVariant?.minBulkQuantity || 1);

  const handleAddToCart = () => {
    if (selectedVariant && quantity > 0) {
      onAddToCart(product, selectedVariant, quantity);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{product.name}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {product.variants && product.variants.length > 0 && (
          <div className="space-y-2">
            <Label>Package Size</Label>
            <Select
              value={selectedVariant?.id?.toString()}
              onValueChange={(value) => {
                const variant = product.variants.find(v => v.id.toString() === value);
                setSelectedVariant(variant);
                setQuantity(variant?.minBulkQuantity || 1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {product.variants.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id.toString()}>
                    {variant.label} - ₹{variant.bulkPrice || variant.price}
                    {variant.minBulkQuantity && ` (Min: ${variant.minBulkQuantity})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedVariant && (
          <>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min={selectedVariant.minBulkQuantity || 1}
              />
              {selectedVariant.minBulkQuantity && (
                <p className="text-xs text-gray-600">
                  Minimum bulk quantity: {selectedVariant.minBulkQuantity}
                </p>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <div className="flex justify-between text-sm">
                <span>Unit Price:</span>
                <span>₹{selectedVariant.bulkPrice || selectedVariant.price}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>₹{((selectedVariant.bulkPrice || selectedVariant.price) * quantity).toLocaleString()}</span>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              className="w-full"
              disabled={quantity < (selectedVariant.minBulkQuantity || 1)}
            >
              Add to Cart
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}