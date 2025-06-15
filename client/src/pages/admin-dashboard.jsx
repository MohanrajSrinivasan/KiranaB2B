import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { AuthService } from '@/lib/auth';
import { Users, Package, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const { user, setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (analyticsLoading) {
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
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {user.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setLocation('/analytics')}
                variant="outline"
              >
                Analytics
              </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{analytics?.orderAnalytics?.totalRevenue?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                +{analytics?.orderAnalytics?.orderGrowth || 0}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.orderAnalytics?.totalOrders || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg. ₹{analytics?.orderAnalytics?.averageOrderValue?.toFixed(0) || 0} per order
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.customerAnalytics?.totalCustomers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics?.customerAnalytics?.activeCustomers || 0} active this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.productAnalytics?.totalProducts || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics?.productAnalytics?.lowStockCount || 0} low stock
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from customers</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders?.slice(0, 10).map((order) => (
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

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>Manage your product inventory</CardDescription>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products?.slice(0, 10).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Stock: {product.stock || 0}</p>
                          {product.isLowStock && (
                            <Badge variant="destructive">Low Stock</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>Monitor stock levels across all products</CardDescription>
              </CardHeader>
              <CardContent>
                {inventoryLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inventory?.slice(0, 10).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-gray-600">
                            Available: {item.availableQuantity || 0}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Min Level: {item.minStockLevel || 0}</p>
                          {(item.availableQuantity || 0) <= (item.minStockLevel || 0) && (
                            <Badge variant="destructive">Low Stock</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>Important notifications and warnings</CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lowStock?.length > 0 ? (
                      lowStock.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 p-4 border border-red-200 rounded-lg bg-red-50">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          <div>
                            <p className="font-medium text-red-900">
                              Low Stock Alert: {item.product?.name}
                            </p>
                            <p className="text-sm text-red-700">
                              Only {item.availableQuantity || 0} units remaining (min: {item.minStockLevel || 0})
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No alerts at this time
                      </p>
                    )}
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