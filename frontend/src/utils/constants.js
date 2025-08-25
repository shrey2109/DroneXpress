// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Socket Configuration
export const SOCKET_CONFIG = {
  URL: process.env.REACT_APP_SOCKET_URL || "http://localhost:5000",
  OPTIONS: {
    transports: ["websocket"],
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  },
};

// User Roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
  CUSTOMER: "CUSTOMER",
};

// Order Status
export const ORDER_STATUS = {
  PENDING: "PENDING",
  ASSIGNED: "ASSIGNED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
};

// Drone Status
export const DRONE_STATUS = {
  AVAILABLE: "AVAILABLE",
  DELIVERING: "DELIVERING",
  CHARGING: "CHARGING",
  MAINTENANCE: "MAINTENANCE",
  OFFLINE: "OFFLINE",
};

// Mission Status
export const MISSION_STATUS = {
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  ABORTED: "ABORTED",
  FAILED: "FAILED",
};

// Delivery Urgency
export const DELIVERY_URGENCY = {
  STANDARD: "STANDARD",
  PRIORITY: "PRIORITY",
  URGENT: "URGENT",
};

// Status Colors for UI
export const STATUS_COLORS = {
  // Order Status Colors
  ORDER: {
    PENDING:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    ASSIGNED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    PICKED_UP:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    IN_TRANSIT:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    DELIVERED:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },

  // Drone Status Colors
  DRONE: {
    AVAILABLE:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    DELIVERING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    CHARGING:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    MAINTENANCE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    OFFLINE: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  },

  // Mission Status Colors
  MISSION: {
    ASSIGNED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    IN_PROGRESS:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    PAUSED:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    COMPLETED:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    ABORTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
};

// Navigation Routes by Role
export const NAVIGATION_ROUTES = {
  [USER_ROLES.ADMIN]: [
    { name: "Analytics", path: "/admin/analytics", icon: "BarChart3" },
    { name: "Drone Management", path: "/admin/drones", icon: "Settings" },
    { name: "User Management", path: "/admin/users", icon: "User" },
  ],
  [USER_ROLES.OPERATOR]: [
    { name: "Dashboard", path: "/operator/dashboard", icon: "BarChart3" },
    { name: "Fleet Monitor", path: "/operator/fleet", icon: "MapPin" },
    { name: "Mission Control", path: "/operator/missions", icon: "Settings" },
  ],
  [USER_ROLES.CUSTOMER]: [
    { name: "Place Order", path: "/customer/place-order", icon: "Plus" },
    { name: "Track Orders", path: "/customer/track-orders", icon: "MapPin" },
    { name: "Order History", path: "/customer/order-history", icon: "Package" },
  ],
};

// Default Redirects by Role
export const DEFAULT_ROUTES = {
  [USER_ROLES.ADMIN]: "/admin/analytics",
  [USER_ROLES.OPERATOR]: "/operator/dashboard",
  [USER_ROLES.CUSTOMER]: "/customer/place-order",
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  PACKAGE_MAX_WEIGHT: 10,
  TRACKING_CODE_PATTERN: /^DD\d{10}[A-Z]{4}$/,
};

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
  SUCCESS: "#10B981",
  WARNING: "#F59E0B",
  ERROR: "#EF4444",
  INFO: "#3B82F6",
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_DATA: "userData",
  THEME: "darkMode",
  LANGUAGE: "language",
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: "Network error. Please check your connection.",
  UNAUTHORIZED: "Session expired. Please login again.",
  FORBIDDEN: "Access denied. Insufficient permissions.",
  NOT_FOUND: "Resource not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: "Login successful!",
  LOGOUT: "Logged out successfully",
  ORDER_CREATED: "Order placed successfully!",
  ORDER_UPDATED: "Order updated successfully!",
  DRONE_UPDATED: "Drone updated successfully!",
  EXPORT_SUCCESS: "Data exported successfully!",
};
