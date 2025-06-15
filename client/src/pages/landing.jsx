import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { AuthService } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const redirectPath = AuthService.getDashboardRoute(user);
      setLocation(redirectPath);
    }
  }, [user, setLocation]);

  const loginForm = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const registerForm = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'retail_user',
      shopName: '',
      region: ''
    }
  });

  const loginMutation = useMutation({
    mutationFn: (data) => apiRequest('POST', '/api/auth/login', data),
    onSuccess: async (response) => {
      const data = await response.json();
      setUser(data.user);
      toast({
        title: t('welcome'),
        description: `Welcome back, ${data.user.name}!`
      });
      setLocation(AuthService.getDashboardRoute(data.user));
    },
    onError: (error) => {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: (data) => apiRequest('POST', '/api/auth/register', data),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: 'Registration Successful',
        description: 'Please login with your credentials.'
      });
      registerForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const onLogin = (data) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data) => {
    registerMutation.mutate(data);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ta' : 'en';
    i18n.changeLanguage(newLang);
  };

  if (user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            KiranaConnect
          </h1>
          <Button onClick={toggleLanguage} variant="outline">
            {i18n.language === 'en' ? 'தமிழ்' : 'English'}
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('welcome')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Connecting Kirana stores, bulk buyers, and retail customers in one unified platform
          </p>
        </div>

        {/* Auth Forms */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Get Started</CardTitle>
              <CardDescription className="text-center">
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">{t('signin')}</TabsTrigger>
                  <TabsTrigger value="register">{t('signup')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        {...loginForm.register('email', { required: true })}
                        placeholder="Enter your email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">{t('password')}</Label>
                      <Input
                        id="password"
                        type="password"
                        {...loginForm.register('password', { required: true })}
                        placeholder="Enter your password"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? t('loading') : t('signin')}
                    </Button>
                  </form>
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Demo accounts:
                    </p>
                    <div className="text-xs space-y-1 mt-2">
                      <p>Admin: admin@kiranaconnect.com / admin123</p>
                      <p>Vendor: vendor@example.com / vendor123</p>
                      <p>Retail: retail@example.com / retail123</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('name')}</Label>
                      <Input
                        id="name"
                        {...registerForm.register('name', { required: true })}
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">{t('email')}</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        {...registerForm.register('email', { required: true })}
                        placeholder="Enter your email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">{t('password')}</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        {...registerForm.register('password', { required: true })}
                        placeholder="Create a password"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('phone')}</Label>
                      <Input
                        id="phone"
                        {...registerForm.register('phone')}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">User Type</Label>
                      <Select onValueChange={(value) => registerForm.setValue('role', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="retail_user">Retail Customer</SelectItem>
                          <SelectItem value="vendor">Kirana Store Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {registerForm.watch('role') === 'vendor' && (
                      <div className="space-y-2">
                        <Label htmlFor="shopName">{t('shopName')}</Label>
                        <Input
                          id="shopName"
                          {...registerForm.register('shopName')}
                          placeholder="Enter your shop name"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="region">{t('region')}</Label>
                      <Select onValueChange={(value) => registerForm.setValue('region', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your region" />
                        </SelectTrigger>
                        <SelectContent>
                          {AuthService.getRegions().map(region => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? t('loading') : t('signup')}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>For Kirana Stores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Access wholesale prices, manage bulk orders, and grow your business with our comprehensive platform.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>For Retail Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Browse products, place orders, and enjoy convenient delivery right to your doorstep.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Real-time Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Stay informed with instant notifications, live order tracking, and WhatsApp updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}