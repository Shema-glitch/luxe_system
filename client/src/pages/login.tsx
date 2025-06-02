import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useLogin, useRegister, useAuth } from "@/hooks/useAuth";
import { loginSchema, registerSchema, type LoginData, type RegisterData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Lock, Mail, User, Shield } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function Login() {
  const [activeTab, setActiveTab] = useState("login");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const { user, isAuthenticated, isLoading, error: authError } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("User authenticated, redirecting to dashboard...", { user, isAuthenticated });
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      console.error("Authentication error:", authError);
      setError("Session expired. Please log in again.");
    }
  }, [authError]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "employee",
    },
  });

  const onLogin = async (data: LoginData) => {
    setError("");
    try {
      console.log("Attempting login...");
      const result = await loginMutation.mutateAsync(data);
      console.log("Login successful:", result);
      
      // Force a refetch of the auth state
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"], exact: true });
      
      // Navigation will be handled by the useEffect when user data is loaded
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
      // Clear password field on error
      loginForm.setValue("password", "");
    }
  };

  const onRegister = async (data: RegisterData) => {
    setError("");
    try {
      console.log("Attempting registration...");
      const result = await registerMutation.mutateAsync(data);
      console.log("Registration successful:", result);
      
      setActiveTab("login"); // Switch to login tab after successful registration
      loginForm.reset(); // Reset login form
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed");
      // Clear password field on error
      registerForm.setValue("password", "");
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Luxe Systems</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Enterprise Inventory Management</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Sign In
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Sign Up
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
              <AlertDescription className="text-red-800 dark:text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <TabsContent value="login">
            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to your Luxe Systems account to manage your inventory
                </CardDescription>
              </CardHeader>
              <form onSubmit={loginForm.handleSubmit(onLogin)}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="username"
                        placeholder="Enter your username"
                        className="pl-10"
                        {...loginForm.register("username")}
                      />
                    </div>
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-red-600">{loginForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        {...loginForm.register("password")}
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">Create Account</CardTitle>
                <CardDescription>
                  Join Luxe Systems to start managing your business inventory
                </CardDescription>
              </CardHeader>
              <form onSubmit={registerForm.handleSubmit(onRegister)}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        {...registerForm.register("firstName")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        {...registerForm.register("lastName")}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="reg-username"
                        placeholder="Choose a username"
                        className="pl-10"
                        {...registerForm.register("username")}
                      />
                    </div>
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-red-600">{registerForm.formState.errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        className="pl-10"
                        {...registerForm.register("email")}
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="Create a secure password"
                        className="pl-10"
                        {...registerForm.register("password")}
                      />
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                      <Select
                        value={registerForm.watch("role")}
                        onValueChange={(value: "admin" | "employee") => registerForm.setValue("role", value)}
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          <p>Secure enterprise-grade inventory management system</p>
          <p className="mt-1">© 2024 Luxe Systems. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}