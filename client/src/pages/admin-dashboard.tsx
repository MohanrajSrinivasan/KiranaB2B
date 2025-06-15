import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Header from "@/components/shared/header";
import AnalyticsCards from "@/components/admin/analytics-cards";
import OrdersTable from "@/components/admin/orders-table";
import ProductsGrid from "@/components/admin/products-grid";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('overview');

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      const dashboardRoute = user.role === 'vendor' ? '/kirana' : '/retail';
      setLocation(dashboardRoute);
    } else if (!user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  const { data: analyticsData } = useQuery({
    queryKey: ['/api/analytics/overview'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: revenueData } = useQuery({
    queryKey: ['/api/analytics/revenue'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: orders } = useQuery({
    queryKey: ['/api/orders'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: products } = useQuery({
    queryKey: ['/api/products'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: inventory } = useQuery({
    queryKey: ['/api/inventory'],
    enabled: !!user && user.role === 'admin',
  });

  if (!user || user.role !== 'admin') {
    return null;
  }

  const recentOrders = orders?.slice(0, 5) || [];
  const orderDistributionData = [
    { name: 'Kirana', value: orders?.filter(o => o.userType === 'vendor').length || 0, color: '#635bff' },
    { name: 'Retail', value: orders?.filter(o => o.userType === 'retail_user').length || 0, color: '#00c896' }
  ];

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-pie' },
    { id: 'orders', label: 'Orders', icon: 'fas fa-shopping-bag' },
    { id: 'products', label: 'Products', icon: 'fas fa-box' },
    { id: 'inventory', label: 'Inventory', icon: 'fas fa-warehouse' },
    { id: 'customers', label: 'Customers', icon: 'fas fa-users' },
    { id: 'analytics', label: 'Analytics', icon: 'fas fa-chart-line' },
  ];

  return (
    <div className="min-h-screen bg-kiranaconnect-bg">
      <Header user={user} userType="admin" />
      
      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white h-[calc(100vh-4rem)] shadow-sm">
          <div className="p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center p-2 text-gray-700 rounded hover:bg-gray-100 transition-colors ${
                      activeSection === item.id ? 'admin-nav-item active' : 'admin-nav-item'
                    }`}
                  >
                    <i className={`${item.icon} mr-3`}></i>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeSection === 'overview' && (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-600">Welcome back, here's what's happening with your business today.</p>
              </div>

              <AnalyticsCards data={analyticsData} />

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData?.monthlyRevenue || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                        <Bar dataKey="revenue" fill="#635bff" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Order Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderDistributionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                        >
                          {orderDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Recent Orders</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">#{order.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.customer?.shopName || order.customer?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              order.userType === 'vendor' 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {order.userType === 'vendor' ? 'Kirana' : 'Retail'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{order.totalAmount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`status-badge status-${order.status}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'orders' && <OrdersTable orders={orders} />}
          {activeSection === 'products' && <ProductsGrid products={products} />}
          
          {activeSection === 'inventory' && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                <p className="text-gray-600">Monitor stock levels and manage inventory</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Stock Overview</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Restock</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventory?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.product?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.availableQuantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.soldQuantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.minStockLevel}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.availableQuantity <= item.minStockLevel
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.availableQuantity <= item.minStockLevel ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.lastRestockDate ? new Date(item.lastRestockDate).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
