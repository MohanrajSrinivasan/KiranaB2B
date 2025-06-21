import { useState } from 'react';
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
import { AuthService } from '@/lib/auth';
import { Users, Package, ShoppingCart, TrendingUp, AlertTriangle, Plus, Edit, Trash2, Eye } from 'lucide-react';

export default function AdminDashboard() {
  const { user, setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    setLocation('/');
    return null;
  }

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/analytics'],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ['/api/inventory'],
  });

  const { data: lowStock, isLoading: lowStockLoading } = useQuery({
    queryKey: ['/api/inventory/low-stock'],
  });

  const createProductMutation = useMutation({
    mutationFn: (productData) => apiRequest('POST', '/api/products', productData),
    onSuccess: () => {
      toast({
        title: 'Product Added',
        description: 'Product has been successfully added to the catalog.'
      });
      setIsAddingProduct(false);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add product. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => apiRequest('PATCH', `/api/products/${id}`, data),
    onSuccess: () => {
      toast({
        title: 'Product Updated',
        description: 'Product has been successfully updated.'
      });
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update product. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => apiRequest('DELETE', `/api/products/${id}`),
    onSuccess: () => {
      toast({
        title: 'Product Deleted',
        description: 'Product has been removed from the catalog.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }) => apiRequest('PATCH', `/api/orders/${id}`, { status }),
    onSuccess: () => {
      toast({
        title: 'Order Updated',
        description: 'Order status has been updated successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update order status.',
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

  const handleAddProduct = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const variants = [];
    const variantLabels = formData.getAll('variant_label[]');
    const variantPrices = formData.getAll('variant_price[]');
    const variantBulkPrices = formData.getAll('variant_bulk_price[]');
    const variantMinBulks = formData.getAll('variant_min_bulk[]');
    const variantUnits = formData.getAll('variant_unit[]');

    for (let i = 0; i < variantLabels.length; i++) {
      if (variantLabels[i] && variantPrices[i]) {
        variants.push({
          label: variantLabels[i],
          price: parseFloat(variantPrices[i]),
          bulkPrice: variantBulkPrices[i] ? parseFloat(variantBulkPrices[i]) : null,
          minBulkQuantity: variantMinBulks[i] ? parseInt(variantMinBulks[i]) : 1,
          unit: variantUnits[i] || 'piece'
        });
      }
    }

    const productData = {
      name: formData.get('name'),
      description: formData.get('description'),
      category: formData.get('category'),
      imageUrl: formData.get('imageUrl'),
      stock: parseInt(formData.get('stock')) || 0,
      tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(Boolean),
      targetUsers: formData.getAll('targetUsers'),
      variants
    };

    createProductMutation.mutate(productData);
  };

  const handleEditProduct = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const productData = {
      name: formData.get('name'),
      description: formData.get('description'),
      category: formData.get('category'),
      imageUrl: formData.get('imageUrl'),
      stock: parseInt(formData.get('stock')) || 0,
      tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(Boolean),
      targetUsers: formData.getAll('targetUsers')
    };

    updateProductMutation.mutate({ id: editingProduct.id, data: productData });
  };

  const categories = [
    'Rice & Grains', 'Flour & Grains', 'Spices', 'Lentils & Pulses', 
    'Oil & Ghee', 'Snacks', 'Beverages', 'Personal Care', 'Cleaning'
  ];

  const filteredProducts = products?.filter(product => 
    selectedCategory === 'all' || product.category === selectedCategory
  ) || [];

  if (analyticsLoading) {
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
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {AuthService.getUserDisplayName(user)}</p>
            </div>
            <Button onClick={() => logoutMutation.mutate()} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{products?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {products?.filter(p => p.isActive)?.length || 0} active products
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {orders?.filter(o => o.status === 'pending')?.length || 0} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{orders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toLocaleString('en-IN') || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">Total revenue</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lowStock?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Items need restocking</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from customers</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : orders?.length > 0 ? (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.username || order.email} • ₹{order.totalAmount?.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <Badge variant={
                          order.status === 'delivered' ? 'default' :
                          order.status === 'processing' ? 'secondary' :
                          order.status === 'pending' ? 'outline' : 'destructive'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No orders found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Product Management</h2>
                <p className="text-muted-foreground">Manage your product catalog</p>
              </div>
              <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>Fill in the product details below</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Product Name</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input id="imageUrl" name="imageUrl" type="url" />
                      </div>
                      <div>
                        <Label htmlFor="stock">Initial Stock</Label>
                        <Input id="stock" name="stock" type="number" min="0" defaultValue="0" />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="tags">Tags (comma separated)</Label>
                      <Input id="tags" name="tags" placeholder="rice, premium, organic" />
                    </div>
                    
                    <div>
                      <Label>Target Users</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" name="targetUsers" value="retail" />
                          <span>Retail</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" name="targetUsers" value="bulk" />
                          <span>Bulk/Kirana</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label>Product Variants</Label>
                      <div className="space-y-3 mt-2">
                        <div className="grid grid-cols-5 gap-2 text-sm font-medium">
                          <span>Label</span>
                          <span>Price (₹)</span>
                          <span>Bulk Price (₹)</span>
                          <span>Min Bulk Qty</span>
                          <span>Unit</span>
                        </div>
                        {[0, 1].map(i => (
                          <div key={i} className="grid grid-cols-5 gap-2">
                            <Input name="variant_label[]" placeholder="1kg" />
                            <Input name="variant_price[]" type="number" step="0.01" placeholder="85.00" />
                            <Input name="variant_bulk_price[]" type="number" step="0.01" placeholder="82.00" />
                            <Input name="variant_min_bulk[]" type="number" placeholder="25" />
                            <Input name="variant_unit[]" placeholder="kg" />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddingProduct(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createProductMutation.isPending}>
                        {createProductMutation.isPending ? 'Adding...' : 'Add Product'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex gap-4 mb-6">
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <CardDescription>{product.category}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteProductMutation.mutate(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-muted rounded-md mb-4 overflow-hidden">
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
                      <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant={product.isActive ? 'default' : 'secondary'}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-sm font-medium">Stock: {product.stock}</span>
                      </div>
                      {product.variants && product.variants.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium mb-1">Variants:</p>
                          {product.variants.slice(0, 2).map((variant, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground">
                              {variant.label}: ₹{variant.price}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Order Management</h2>
              <p className="text-muted-foreground">Monitor and manage customer orders</p>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : orders?.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Order #{order.id}</CardTitle>
                          <CardDescription>
                            {order.username || order.email} • {new Date(order.orderDate).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            order.status === 'delivered' ? 'default' :
                            order.status === 'processing' ? 'secondary' :
                            order.status === 'pending' ? 'outline' : 'destructive'
                          }>
                            {order.status}
                          </Badge>
                          <Select
                            value={order.status}
                            onValueChange={(status) => updateOrderMutation.mutate({ id: order.id, status })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
                          <p className="text-sm font-medium">Payment Status</p>
                          <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'outline'}>
                            {order.paymentStatus || 'pending'}
                          </Badge>
                        </div>
                      </div>
                      {order.shippingAddress && (
                        <div className="mt-4">
                          <p className="text-sm font-medium">Shipping Address</p>
                          <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
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
                  <p className="text-muted-foreground">No orders found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Inventory Management</h2>
              <p className="text-muted-foreground">Monitor stock levels and manage inventory</p>
            </div>

            {lowStock && lowStock.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="w-5 h-5" />
                    Low Stock Alert
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lowStock.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <span className="font-medium">{item.productName}</span>
                        <Badge variant="destructive">
                          {item.stock} / {item.minStock} min
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {inventoryLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inventory?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">{item.productCategory}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Stock: {item.stock}</p>
                          <p className="text-sm text-muted-foreground">Min: {item.minStock}</p>
                        </div>
                      </div>
                    )) || <p className="text-center text-muted-foreground py-8">No inventory data</p>}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Analytics & Reports</h2>
              <p className="text-muted-foreground">Business insights and performance metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Orders:</span>
                      <span className="font-medium">{orders?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending:</span>
                      <span className="font-medium">{orders?.filter(o => o.status === 'pending')?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing:</span>
                      <span className="font-medium">{orders?.filter(o => o.status === 'processing')?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivered:</span>
                      <span className="font-medium">{orders?.filter(o => o.status === 'delivered')?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Revenue:</span>
                      <span className="font-medium">
                        ₹{orders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toLocaleString('en-IN') || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Order:</span>
                      <span className="font-medium">
                        ₹{orders?.length ? Math.round(orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length).toLocaleString('en-IN') : '0'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Products:</span>
                      <span className="font-medium">{products?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Products:</span>
                      <span className="font-medium">{products?.filter(p => p.isActive)?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Stock Items:</span>
                      <span className="font-medium">{lowStock?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Product Dialog */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>Update product details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Product Name</Label>
                  <Input id="edit-name" name="name" defaultValue={editingProduct.name} required />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select name="category" defaultValue={editingProduct.category}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" name="description" defaultValue={editingProduct.description} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-imageUrl">Image URL</Label>
                  <Input id="edit-imageUrl" name="imageUrl" type="url" defaultValue={editingProduct.imageUrl} />
                </div>
                <div>
                  <Label htmlFor="edit-stock">Stock</Label>
                  <Input id="edit-stock" name="stock" type="number" min="0" defaultValue={editingProduct.stock} />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                <Input id="edit-tags" name="tags" defaultValue={editingProduct.tags?.join(', ')} />
              </div>
              
              <div>
                <Label>Target Users</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      name="targetUsers" 
                      value="retail"
                      defaultChecked={editingProduct.targetUsers?.includes('retail')}
                    />
                    <span>Retail</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      name="targetUsers" 
                      value="bulk"
                      defaultChecked={editingProduct.targetUsers?.includes('bulk')}
                    />
                    <span>Bulk/Kirana</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProductMutation.isPending}>
                  {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}