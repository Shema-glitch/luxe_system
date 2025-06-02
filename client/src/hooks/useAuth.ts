import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { LoginData, RegisterData } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the user data
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch when component mounts
    refetchInterval: 0, // Don't refetch automatically
    refetchOnReconnect: true, // Refetch when reconnecting
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    refetch,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important for cookies
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      
      const data = await response.json();
      return data;
    },
    onSuccess: async (data) => {
      // Update the cache with the user data
      queryClient.setQueryData(["/api/auth/user"], data);
      // Force a refetch to ensure we have the latest data
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"], exact: true });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important for cookies
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }
      
      const data = await response.json();
      return data;
    },
    onSuccess: async (data) => {
      // Update the cache with the user data
      queryClient.setQueryData(["/api/auth/user"], data);
      // Force a refetch to ensure we have the latest data
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"], exact: true });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Important for cookies
      });
      
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Clear all queries from the cache
      queryClient.clear();
      // Remove the user data from cache
      queryClient.setQueryData(["/api/auth/user"], null);
      // Force a refetch of the user data to ensure we're logged out
      queryClient.refetchQueries({ queryKey: ["/api/auth/user"], exact: true });
      // Navigate to login page
      window.location.href = "/login";
    },
  });
}
