import { TrendingUp, ShoppingCart, Users, AlertTriangle } from "lucide-react";

interface AnalyticsData {
  totalRevenueumber;
  totalOrdersumber;
  activeCustomersumber;
  lowStockItemsumber;
}

interface AnalyticsCardsProps {
  data?nalyticsData;
}

export default function AnalyticsCards({ data }nalyticsCardsProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
            <div className="flex items-center">
              <div className="p-2 bg-gray-200 rounded-lg w-10 h-10"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Revenue",
      value: `₹${data.totalRevenue?.toLocaleString() || 0}`,
      iconrendingUp,
      color: "primary",
      change: "+12.5%",
      changeText: "from last month",
    },
    {
      title: "Total Orders",
      valueata.totalOrders?.toLocaleString() || 0,
      iconhoppingCart,
      color: "accent",
      change: "+8.2%",
      changeText: "from last month",
    },
    {
      title: "Active Customers",
      valueata.activeCustomers?.toLocaleString() || 0,
      iconsers,
      color: "yellow-500",
      change: "+15.3%",
      changeText: "from last month",
    },
    {
      title: "Low Stock Items",
      valueata.lowStockItems?.toLocaleString() || 0,
      iconlertTriangle,
      color: "red-500",
      change: "Needs attention",
      changeText: "",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className={`p-2 bg-${card.color}/10 rounded-lg`}>
              <card.icon className={`h-5 w-5 text-${card.color === 'primary' ? 'primary' ard.color === 'accent' ? 'accent' ard.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-sm ${card.color === 'red-500' ? 'text-red-600' : 'text-accent'}`}>
              {card.change}
            </span>
            {card.changeText && (
              <span className="text-gray-500 text-sm ml-1">{card.changeText}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
