import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface LoginModalProps {
  isOpenoolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }oginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const loginMutation = useMutation({
    mutationFnsync ({ email, password }: { emailtring; passwordtring }) => {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
      onClose();
      
      // Redirect to appropriate dashboard
      const dashboardRoute = data.user.role === 'admin' ? '/admin' : 
                           data.user.role === 'vendor' ? '/kirana' : '/retail';
      setLocation(dashboardRoute);
    },
    onError: (errorny) => {
      toast({
        title: "Login failed",
        descriptionrror.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ email, password });
  };

  const handleDemoLogin = (roletring) => {
    const demoCredentials = {
      admin: { email: "admin@kiranaconnect.com", password: "admin123" },
      vendor: { email: "vendor@example.com", password: "vendor123" },
      retail: { email: "retail@example.com", password: "retail123" },
    };

    const credentials = demoCredentials[role as keyof typeof demoCredentials];
    if (credentials) {
      setEmail(credentials.email);
      setPassword(credentials.password);
      loginMutation.mutate(credentials);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            Sign in to KiranaConnect
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">Welcome back! Please sign in to your account</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm text-gray-600">
                Remember me
              </Label>
            </div>
            <Button variant="link" className="text-sm text-primary hover:underline p-0">
              Forgot password?
            </Button>
          </div>
          
          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-primary text-white hover:bg-primary/90"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6">
          <div className="text-center text-sm text-gray-600 mb-3">Or try demo accounts:</div>
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => handleDemoLogin('admin')}
              className="w-full text-sm"
            >
              Demo Admin Login
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleDemoLogin('vendor')}
                className="text-sm"
              >
                Demo Kirana
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDemoLogin('retail')}
                className="text-sm"
              >
                Demo Retail
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Button 
              variant="link" 
              onClick={onSwitchToRegister}
              className="text-primary hover:underline p-0"
            >
              Sign up
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
