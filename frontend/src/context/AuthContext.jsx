import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on app load
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        // Validate token with backend
        const userData = await authService.validateToken(token);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      // Token invalid, clear it
      localStorage.removeItem("authToken");
      console.error("Auth validation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password, role) => {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password, role);

      const { user: userData, token } = response;

      localStorage.setItem("authToken", token);
      setUser(userData);
      setIsAuthenticated(true);

      toast.success(`Welcome back, ${userData.name}!`);

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.error || "Login failed";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("authToken");
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
    }
  };

  const register = async (name, email, password, role) => {
    try {
      setIsLoading(true);
      const response = await authService.register({ name, email, password, role });

      const { user: newUser, token } = response;

      localStorage.setItem("authToken", token);
      setUser(newUser);
      setIsAuthenticated(true);

      toast.success(`Welcome, ${newUser.name}!`);

      return { success: true, user: newUser };
    } catch (error) {
      const message = error.response?.data?.error || "Registration failed";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    updateUser,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
