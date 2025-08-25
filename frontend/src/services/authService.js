import { apiService } from "./api";

export const authService = {
  // Login user
  login: async (email, password, role) => {
    console.log(email + ":" + password + ":" + role);
    try {
      const response = await apiService.post("/auth/login", {
        email,
        password,
        role,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await apiService.post("/auth/register", userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      // If backend has logout endpoint
      // await apiService.post('/auth/logout');
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  // Validate token
  validateToken: async (token) => {
    try {
      const response = await apiService.post("/auth/refresh", { token });
      return response.user;
    } catch (error) {
      throw error;
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await apiService.post("/auth/refresh", { token });
      localStorage.setItem("authToken", response.token);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await apiService.get("/auth/me");
      return response.user;
    } catch (error) {
      throw error;
    }
  },
};
