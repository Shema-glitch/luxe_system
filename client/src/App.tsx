import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { RouteGuard } from "@/components/RouteGuard";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useSidebar } from "@/contexts/sidebar-context";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Categories from "@/pages/categories";
import Sales from "@/pages/sales";
import Purchases from "@/pages/purchases";
import StockMovement from "@/pages/stock-movement";
import Employees from "@/pages/employees";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

interface User {
  role: string;
  permissions?: string[];
}

// Protected Route component with role and permission checks
function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermission 
}: { 
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}) {
  const { user } = useAuth() as { user: User | null };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && !user.permissions?.includes(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Layout component for authenticated pages
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className={isCollapsed ? "pl-20" : "pl-64"}>
        <Header />
        <main className="pt-16 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes with layout */}
              <Route
                path="/dashboard"
                element={
                  <RouteGuard>
                    <AuthenticatedLayout>
                      <Dashboard />
                    </AuthenticatedLayout>
                  </RouteGuard>
                }
              />
              
              <Route
                path="/products"
                element={
                  <RouteGuard>
                    <AuthenticatedLayout>
                      <Products />
                    </AuthenticatedLayout>
                  </RouteGuard>
                }
              />

              <Route
                path="/categories"
                element={
                  <RouteGuard>
                    <AuthenticatedLayout>
                      <Categories />
                    </AuthenticatedLayout>
                  </RouteGuard>
                }
              />

              <Route
                path="/sales"
                element={
                  <RouteGuard>
                    <AuthenticatedLayout>
                      <ProtectedRoute requiredPermission="sales">
                        <Sales />
                      </ProtectedRoute>
                    </AuthenticatedLayout>
                  </RouteGuard>
                }
              />

              <Route
                path="/purchases"
                element={
                  <RouteGuard>
                    <AuthenticatedLayout>
                      <ProtectedRoute requiredPermission="purchases">
                        <Purchases />
                      </ProtectedRoute>
                    </AuthenticatedLayout>
                  </RouteGuard>
                }
              />

              <Route
                path="/stock-movement"
                element={
                  <RouteGuard>
                    <AuthenticatedLayout>
                      <ProtectedRoute requiredPermission="stock_in">
                        <StockMovement />
                      </ProtectedRoute>
                    </AuthenticatedLayout>
                  </RouteGuard>
                }
              />

              <Route
                path="/users"
                element={
                  <RouteGuard>
                    <AuthenticatedLayout>
                      <ProtectedRoute requiredRole="admin">
                        <Employees />
                      </ProtectedRoute>
                    </AuthenticatedLayout>
                  </RouteGuard>
                }
              />

              <Route
                path="/reports"
                element={
                  <RouteGuard>
                    <AuthenticatedLayout>
                      <ProtectedRoute requiredPermission="view_reports">
                        <Reports />
                      </ProtectedRoute>
                    </AuthenticatedLayout>
                  </RouteGuard>
                }
              />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
          <Toaster />
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
