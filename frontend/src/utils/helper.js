import { STATUS_COLORS, VALIDATION_RULES } from "./constants";

// Date and Time Helpers
export const formatDate = (date, options = {}) => {
  if (!date) return "N/A";

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  return new Date(date).toLocaleDateString(undefined, defaultOptions);
};

export const formatDateTime = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString();
};

export const formatTime = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getTimeAgo = (date) => {
  if (!date) return "N/A";

  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
    }
  }

  return "Just now";
};

// Status Helper Functions
export const getStatusColor = (status, type = "ORDER") => {
  return STATUS_COLORS[type]?.[status] || STATUS_COLORS.ORDER.PENDING;
};

export const formatStatus = (status) => {
  if (!status) return "Unknown";
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

// Validation Helpers
export const validateEmail = (email) => {
  return VALIDATION_RULES.EMAIL.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH;
};

export const validatePackageWeight = (weight) => {
  return weight > 0 && weight <= VALIDATION_RULES.PACKAGE_MAX_WEIGHT;
};

export const validateTrackingCode = (code) => {
  return VALIDATION_RULES.TRACKING_CODE_PATTERN.test(code);
};

// Distance and Location Helpers
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

// Currency and Number Helpers
export const formatCurrency = (amount, currency = "USD") => {
  if (amount === null || amount === undefined) return "N/A";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return "N/A";
  return Number(number).toFixed(decimals);
};

export const formatPercentage = (value, total) => {
  if (!total || total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
};

// Battery Helper Functions
export const getBatteryColor = (battery) => {
  if (battery > 60) return "text-green-600";
  if (battery > 30) return "text-yellow-600";
  return "text-red-600";
};

export const getBatteryIcon = (battery) => {
  if (battery > 75) return "battery-full";
  if (battery > 50) return "battery-three-quarters";
  if (battery > 25) return "battery-half";
  return "battery-low";
};

// Array and Object Helpers
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = "asc") => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (direction === "asc") {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });
};

export const filterBy = (array, filters) => {
  return array.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true; // Skip empty filters
      return item[key]
        ?.toString()
        .toLowerCase()
        .includes(value.toString().toLowerCase());
    });
  });
};

// String Helpers
export const truncateText = (text, length = 100) => {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
};

export const capitalizeFirst = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const generateTrackingCode = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `DD${timestamp.slice(-10)}${random}`;
};

// Local Storage Helpers
export const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to set localStorage:", error);
  }
};

export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Failed to get localStorage:", error);
    return defaultValue;
  }
};

export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove localStorage:", error);
  }
};

// Debounce Helper
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// File Helpers
export const downloadFile = (data, filename, type = "text/csv") => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Error Handling Helpers
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.error || "Server error occurred",
      status: error.response.status,
      type: "server",
    };
  } else if (error.request) {
    // Request made but no response
    return {
      message: "Network error. Please check your connection.",
      type: "network",
    };
  } else {
    // Other error
    return {
      message: error.message || "An unexpected error occurred",
      type: "client",
    };
  }
};
