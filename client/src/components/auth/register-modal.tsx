import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    shopName: "",
    region: "",
    password: "",
  });
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const registerMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      toast({
        title: "Account created successfully!",
        description: "Welcome to KiranaConnect. You can now start using the platform.",
      });
      onClose();
      
      // Redirect to appropriate dashboard
      const dashboardRoute = data.user.role === 'admin' ? '/admin' : 
                           data.user.role === 'vendor' ? '/kirana' : '/retail';
      setLocation(dashboardRoute);
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Unable to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.role || !formData.password) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.role === 'vendor' && !formData.shopName) {
      toast({
        title: "Shop name required",
        description: "Please enter your shop name for vendor registration",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate(formData);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            Create Account
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">Join KiranaConnect today</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Enter your full name"
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="Enter your email"
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              User Type *
            </Label>
            <Select value={formData.role} onValueChange={(value) => updateFormData('role', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retail_user">Retail Customer</SelectItem>
                <SelectItem value="vendor">Kirana Store Owner</SelectItem>
                <SelectItem value="admin">Distributor/Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.role === 'vendor' && (
            <div>
              <Label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
                Shop Name *
              </Label>
              <Input
                id="shopName"
                type="text"
                value={formData.shopName}
                onChange={(e) => updateFormData('shopName', e.target.value)}
                placeholder="Enter your shop name"
                className="w-full"
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
              Region
            </Label>
            <Select value={formData.region} onValueChange={(value) => updateFormData('region', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Chennai">Chennai</SelectItem>
                <SelectItem value="Coimbatore">Coimbatore</SelectItem>
                <SelectItem value="Madurai">Madurai</SelectItem>
                <SelectItem value="Salem">Salem</SelectItem>
                <SelectItem value="Trichy">Trichy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => updateFormData('password', e.target.value)}
              placeholder="Create a password"
              className="w-full"
            />
          </div>
          
          <Button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-primary text-white hover:bg-primary/90"
          >
            {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Button 
              variant="link" 
              onClick={onSwitchToLogin}
              className="text-primary hover:underline p-0"
            >
              Sign in
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
