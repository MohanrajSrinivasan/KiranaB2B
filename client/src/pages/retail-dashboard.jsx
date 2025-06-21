import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useRealTimeOrders } from '@/hooks/use-socket';
import { Package, ShoppingCart, TrendingUp, Clock, Plus, Minus, Search, Star } from 'lucide-react';
import { AuthService } from '@/lib/auth';

export default function RetailDashboard() {
  const { user, setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [orderDialog, setOrderDialog] = useState(false);
  const realtimeOrders = useRealTimeOrders();

  // Redirect if not retail user
  if (!user || user.role !== 'retail') {
    setLocation('/');
    return null;
  }

  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['/api/products'],
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
    retry: 3,
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => apiRequest('POST', '/api/orders', orderData),
    onSuccess: () => {
      toast({
        title: 'Order Placed Successfully',
        description: 'Your order has been submitted. You will receive WhatsApp confirmation.'
      });
      setCart([]);
      setOrderDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: (error) => {
      toast({
        title: 'Order Failed',
        description: error.message || 'Failed to place order. Please try again.',
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
        title: 'Logged Out',
        description: 'You have been successfully logged out.'
      });
    }
  });

  const addToCart = (product, variant, quantity = 1) => {
    const cartItemId = `${product.id}-${variant.id}`;
    const existingItem = cart.find(item => item.id === cartItemId);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === cartItemId 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, {
        id: cartItemId,
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        variant: variant.label,
        price: variant.price,
        quantity,
        unit: variant.unit,
        imageUrl: product.imageUrl
      }]);
    }
    
    toast({
      title: 'Added to Cart',
      description: `${product.name} (${variant.label}) added to cart`
    });
  };

  const updateCartQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== cartItemId));
    } else {
      setCart(cart.map(item => 
        item.id === cartItemId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = (event) => {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const orderData = {
      items: cart.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: getCartTotal(),
      shippingAddress: formData.get('shippingAddress'),
      paymentMethod: formData.get('paymentMethod') || 'COD',
      status: 'pending'
    };

    createOrderMutation.mutate(orderData);
  };

  const categories = [
    'Rice & Grains', 'Flour & Grains', 'Spices', 'Lentils & Pulses', 
    'Oil & Ghee', 'Snacks', 'Beverages', 'Personal Care', 'Cleaning'
  ];

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const isTargetUser = product.targetUsers?.includes('retail') || !product.targetUsers?.length;
    
    return matchesSearch && matchesCategory && isTargetUser && product.isActive;
  }) || [];

  const myOrders = orders?.filter(order => order.userId === user?.id) || [];

  // Debug products loading
  useEffect(() => {
    if (productsError) {
      console.error('Products loading error:', productsError);
      toast({
        title: 'Error Loading Products',
        description: 'Failed to load products. Please refresh the page.',
        variant: 'destructive'
      });
    }
  }, [productsError]);

  if (productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Retail Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {AuthService.getUserDisplayName(user)}</p>
            </div>
            <div className="flex items-center gap-4">
              {cart.length > 0 && (
                <Button onClick={() => setOrderDialog(true)} className="relative">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart ({cart.length})
                  <Badge className="ml-2 bg-red-500">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                </Button>
              )}
              <Button onClick={() => logoutMutation.mutate()} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Browse Products</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {productsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted overflow-hidden">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <CardDescription>{product.category}</CardDescription>
                        </div>
                        <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                      
                      {product.variants && product.variants.length > 0 ? (
                        <div className="space-y-3">
                          {product.variants.map((variant) => (
                            <div key={variant.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{variant.label}</p>
                                <p className="text-lg font-bold">₹{variant.price}</p>
                                <p className="text-xs text-muted-foreground">per {variant.unit}</p>
                              </div>
                              <Button
                                onClick={() => addToCart(product, variant, 1)}
                                disabled={product.stock <= 0}
                                size="sm"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No variants available
                        </div>
                      )}
                      
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {product.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {products?.length === 0 ? 'No products available' : 'No products match your search criteria'}
                  </p>
                  {searchTerm && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchTerm('')}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">My Orders</h2>
              <p className="text-muted-foreground">Track your order history and status</p>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : myOrders.length > 0 ? (
              <div className="space-y-4">
                {myOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Order #{order.id}</CardTitle>
                          <CardDescription>
                            Placed on {new Date(order.orderDate).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          order.status === 'delivered' ? 'default' :
                          order.status === 'processing' ? 'secondary' :
                          order.status === 'pending' ? 'outline' : 'destructive'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium">Total Amount</p>
                          <p className="text-2xl font-bold">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Payment Method</p>
                          <p>{order.paymentMethod || 'COD'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Items</p>
                          <p>{order.items?.length || 0} items</p>
                        </div>
                      </div>
                      {order.deliveryDate && (
                        <div className="mt-4">
                          <p className="text-sm font-medium">Expected Delivery</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.deliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No orders placed yet</p>
                  <Button onClick={() => document.querySelector('[value="products"]').click()} className="mt-4">
                    Start Shopping
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Purchase Analytics</h2>
              <p className="text-muted-foreground">Your shopping patterns and statistics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{myOrders.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{myOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toLocaleString('en-IN')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {myOrders.filter(order => order.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{myOrders.length ? Math.round(myOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / myOrders.length).toLocaleString('en-IN') : '0'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Order History Trends</CardTitle>
                <CardDescription>Your recent ordering activity</CardDescription>
              </CardHeader>
              <CardContent>
                {myOrders.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Most Recent Order</p>
                        <p className="text-lg font-bold">
                          {myOrders.length > 0 ? new Date(Math.max(...myOrders.map(o => new Date(o.orderDate)))).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Largest Order</p>
                        <p className="text-lg font-bold">
                          ₹{Math.max(...myOrders.map(o => o.totalAmount || 0)).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Order Status Distribution</p>
                      <div className="space-y-2">
                        {['pending', 'processing', 'shipped', 'delivered'].map(status => {
                          const count = myOrders.filter(o => o.status === status).length;
                          const percentage = myOrders.length ? (count / myOrders.length * 100).toFixed(1) : 0;
                          return (
                            <div key={status} className="flex items-center justify-between">
                              <span className="capitalize">{status}:</span>
                              <span>{count} ({percentage}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-4" />
                    <p>Start placing orders to see your analytics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Cart/Order Dialog */}
      <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Order</DialogTitle>
            <DialogDescription>Review your cart and place order</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3">
              <h3 className="font-medium">Cart Items</h3>
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.variant}</p>
                    <p className="text-sm font-medium">₹{item.price} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total: ₹{getCartTotal().toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Order Form */}
            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div>
                <Label htmlFor="shippingAddress">Shipping Address</Label>
                <Textarea 
                  id="shippingAddress" 
                  name="shippingAddress" 
                  required 
                  placeholder="Enter your complete shipping address"
                />
              </div>
              
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select name="paymentMethod" defaultValue="COD">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COD">Cash on Delivery</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Card">Credit/Debit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOrderDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createOrderMutation.isPending || cart.length === 0}>
                  {createOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}