import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, BarChart3, Package, Users, TrendingUp, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">DukaSmart</h1>
            </div>
            <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Smart Stock Management
            <span className="block text-primary">for Modern Retailers</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
            DukaSmart helps small and medium retailers organize, track, and monitor their inventory 
            with powerful offline-first capabilities designed for real-world retail environments.
          </p>
          <div className="mt-10">
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-4"
            >
              Get Started Today
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to manage your inventory</h2>
            <p className="mt-4 text-lg text-gray-600">
              Comprehensive tools designed specifically for retail environments
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Management</h3>
                <p className="text-gray-600">
                  Add products with images, unique codes, and organize them into dynamic categories 
                  and subcategories for easy tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sales & Purchase Tracking</h3>
                <p className="text-gray-600">
                  Record sales and purchases with detailed cost tracking, supplier information, 
                  and automatic stock quantity updates.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Analytics</h3>
                <p className="text-gray-600">
                  Get insights into your business with comprehensive reporting, low stock alerts, 
                  and sales performance metrics.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Management</h3>
                <p className="text-gray-600">
                  Create employee accounts with role-based permissions and track all 
                  sales and stock movements by user.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Offline First</h3>
                <p className="text-gray-600">
                  Works seamlessly without internet connection, perfect for environments 
                  with limited or inconsistent connectivity.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center mb-4">
                  <Store className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Category Support</h3>
                <p className="text-gray-600">
                  Handle diverse inventory from electronics to fashion with flexible 
                  category structures and product codes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-primary/5 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to transform your inventory management?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join retailers who have streamlined their operations with DukaSmart's 
              comprehensive stock management solution.
            </p>
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-4"
            >
              Start Managing Your Inventory
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="text-gray-600">DukaSmart - Smart Stock Management</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
