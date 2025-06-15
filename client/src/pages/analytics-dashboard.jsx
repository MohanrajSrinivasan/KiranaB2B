import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, ShoppingCart, Package, AlertTriangle, DollarSign } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsDashboard() {
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

  const orderAnalytics = analytics?.orderAnalytics || {};
  const customerAnalytics = analytics?.customerAnalytics || {};
  const productAnalytics = analytics?.productAnalytics || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Business insights and performance metrics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setLocation('/admin')}
                variant="outline"
              >
                Back to Admin
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
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{orderAnalytics.totalRevenue?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                +{orderAnalytics.orderGrowth || 0}% from last month
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
                {orderAnalytics.totalOrders || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg. ₹{orderAnalytics.averageOrderValue?.toFixed(0) || 0} per order
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
                {customerAnalytics.totalCustomers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                +{customerAnalytics.customerGrowth || 0}% growth
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {productAnalytics.lowStockCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Require restocking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={orderAnalytics.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Volume */}
          <Card>
            <CardHeader>
              <CardTitle>Order Volume</CardTitle>
              <CardDescription>Monthly order count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={orderAnalytics.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Regional Distribution and Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Regional Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Distribution by Region</CardTitle>
              <CardDescription>Regional customer base</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={customerAnalytics.regionDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ region, customers }) => `${region}: ${customers}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="customers"
                  >
                    {(customerAnalytics.regionDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Sales</CardTitle>
              <CardDescription>Best performing products</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={productAnalytics.topProducts || []}
                  layout="horizontal"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip formatter={(value) => [value, 'Sales']} />
                  <Bar dataKey="sales" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
            <CardDescription>Detailed product sales data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Product Name</th>
                    <th className="text-left p-4 font-medium">Sales Count</th>
                    <th className="text-left p-4 font-medium">Revenue</th>
                    <th className="text-left p-4 font-medium">Avg. Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(productAnalytics.topProducts || []).map((product, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-4">{product.name}</td>
                      <td className="p-4">{product.sales}</td>
                      <td className="p-4">₹{product.revenue?.toLocaleString()}</td>
                      <td className="p-4">₹{(product.revenue / product.sales).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Customers:</span>
                  <span className="font-medium">{customerAnalytics.totalCustomers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active This Month:</span>
                  <span className="font-medium">{customerAnalytics.activeCustomers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Growth Rate:</span>
                  <span className="font-medium text-green-600">+{customerAnalytics.customerGrowth || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Orders:</span>
                  <span className="font-medium">{orderAnalytics.totalOrders || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. Order Value:</span>
                  <span className="font-medium">₹{orderAnalytics.averageOrderValue?.toFixed(0) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Growth Rate:</span>
                  <span className="font-medium text-green-600">+{orderAnalytics.orderGrowth || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Products:</span>
                  <span className="font-medium">{productAnalytics.totalProducts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Low Stock Items:</span>
                  <span className="font-medium text-red-600">{productAnalytics.lowStockCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Categories:</span>
                  <span className="font-medium">5+</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}