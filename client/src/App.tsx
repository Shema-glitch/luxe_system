import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SidebarLayout } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Route, Switch } from "wouter";
import { Suspense } from "react";

import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Categories from "@/pages/categories";
import Sales from "@/pages/sales";
import Purchases from "@/pages/purchases";
import StockMovement from "@/pages/stock-movement";
import Employees from "@/pages/employees";
import Reports from "@/pages/reports";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <SidebarLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/products" component={Products} />
          <Route path="/categories" component={Categories} />
          <Route path="/sales" component={Sales} />
          <Route path="/purchases" component={Purchases} />
          <Route path="/stock-movement" component={StockMovement} />
          <Route path="/employees" component={Employees} />
          <Route path="/reports" component={Reports} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </SidebarLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;