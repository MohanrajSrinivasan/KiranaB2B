import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types";

interface HeaderProps {
  userser;
  userType: 'admin' | 'retail' | 'kirana';
  cartCount?umber;
}

export default function Header({ user, userType, cartCount = 0 }eaderProps) {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFnsync () => {
      const response = await apiRequest('POST', '/api/auth/logout', {});
      return response.json();
    },
    onSuccess: () => {
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation('/');
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'admin'eturn 'Admin';
      case 'retail'eturn 'Retail';
      case 'kirana'eturn 'Kirana';
      defaulteturn '';
    }
  };

  const getUserTypeColor = () => {
    switch (userType) {
      case 'admin'eturn 'bg-primary/10 text-primary';
      case 'retail'eturn 'bg-accent/10 text-accent';
      case 'kirana'eturn 'bg-yellow-500/10 text-yellow-600';
      defaulteturn 'bg-gray-100 text-gray-800';
    }
  };

  const getDefaultAvatar = () => {
    // Generate a simple avatar based on user's name initials
    const initials = user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return (
      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
        {initials}
      </div>
    );
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-primary">KiranaConnect</span>
            <Badge className={`ml-4 ${getUserTypeColor()}`}>
              {getUserTypeLabel()}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Cart Icon for Retail and Kirana users */}
            {(userType === 'retail' || userType === 'kirana') && (
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <i className="fas fa-shopping-cart text-lg"></i>
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center p-0 min-w-[1.25rem]">
                    {cartCount}
                  </Badge>
                )}
              </button>
            )}
            
            {/* Notifications for Admin */}
            {userType === 'admin' && (
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <i className="fas fa-bell text-lg"></i>
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0 min-w-[1.25rem]">
                  3
                </Badge>
              </button>
            )}
            
            {/* Language Selector */}
            <Select defaultValue="en">
              <SelectTrigger className="w-32 border-0 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
              </SelectContent>
            </Select>
            
            {/* User Profile */}
            <div className="flex items-center space-x-2">
              {getDefaultAvatar()}
              <div className="hidden sm:block">
                <span className="text-sm font-medium text-gray-900">
                  {user.shopName || user.name}
                </span>
                {user.shopName && (
                  <div className="text-xs text-gray-500">{user.name}</div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
