import axios from "axios";
import toast from "react-hot-toast";

// Base API configuration
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.error || error.message || "An error occurred";

    // Handle specific error codes
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("authToken");
      window.location.href = "/login";
      toast.error("Session expired. Please login again.");
    } else if (error.response?.status === 403) {
      toast.error("Access denied. Insufficient permissions.");
    } else if (error.response?.status === 404) {
      toast.error("Resource not found.");
    } else if (error.response?.status >= 500) {
      toast.error("Server error. Please try again later.");
    } else if (error.response?.status >= 400) {
      toast.error(message);
    } else if (error.code === "NETWORK_ERROR" || !error.response) {
      toast.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  }
);

// Generic API methods
export const apiService = {
  // GET request
  get: async (endpoint, params = {}) => {
    try {
      const response = await api.get(endpoint, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // POST request
  post: async (endpoint, data = {}) => {
    try {
      const response = await api.post(endpoint, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // PUT request
  put: async (endpoint, data = {}) => {
    try {
      const response = await api.put(endpoint, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // PATCH request
  patch: async (endpoint, data = {}) => {
    try {
      const response = await api.patch(endpoint, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // DELETE request
  delete: async (endpoint) => {
    try {
      const response = await api.delete(endpoint);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Upload file
  upload: async (endpoint, file, onProgress = null) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        };
      }

      const response = await api.post(endpoint, formData, config);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
