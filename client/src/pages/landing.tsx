import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoginModal from "@/components/auth/login-modal";
import RegisterModal from "@/components/auth/register-modal";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [language, setLanguage] = useState("en");
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to their dashboard
  if (user) {
    const dashboardRoute = user.role === 'admin' ? '/admin' : 
                          user.role === 'vendor' ? '/kirana' : '/retail';
    setLocation(dashboardRoute);
    return null;
  }

  return (
    <div className="min-h-screen bg-kiranaconnect-bg">
      {/* Header Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-primary">KiranaConnect</span>
              </div>
              <nav className="hidden md:ml-8 md:flex space-x-8">
                <a href="#features" className="text-gray-700 hover:text-primary transition-colors">Features</a>
                <a href="#pricing" className="text-gray-700 hover:text-primary transition-colors">Pricing</a>
                <a href="#about" className="text-gray-700 hover:text-primary transition-colors">About</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-32 border-0 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                onClick={() => setShowLogin(true)}
                className="text-gray-700 hover:text-primary"
              >
                Login
              </Button>
              <Button 
                onClick={() => setShowRegister(true)}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Connect <span className="text-primary">Kirana Stores</span> with <span className="text-accent">Distributors</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The complete B2B/B2C platform for bulk buyers, retail customers, and distributors. 
            Streamline orders, manage inventory, and grow your business with real-time analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setShowRegister(true)}
              size="lg"
              className="bg-primary text-white hover:bg-primary/90"
            >
              Start Free Trial
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to manage your distribution business</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line text-primary text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-gray-600">Track sales, inventory, and customer behavior with comprehensive dashboards</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-mobile-alt text-accent text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">WhatsApp Integration</h3>
              <p className="text-gray-600">Automated order updates and customer communication via WhatsApp</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-boxes text-yellow-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Inventory Management</h3>
              <p className="text-gray-600">Smart stock tracking with low-inventory alerts and reorder suggestions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <LoginModal 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />
      <RegisterModal 
        isOpen={showRegister} 
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </div>
  );
}
