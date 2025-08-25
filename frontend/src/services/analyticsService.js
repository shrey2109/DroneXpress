import { apiService } from "./api";

export const analyticsService = {
  // Get dashboard KPIs
  getDashboardKPIs: async () => {
    try {
      const response = await apiService.get("/analytics/dashboard");
      return response.kpis;
    } catch (error) {
      throw error;
    }
  },

  // Get daily delivery statistics
  getDailyDeliveries: async (days = 7) => {
    try {
      const response = await apiService.get("/analytics/daily-deliveries", {
        days,
      });
      return response.dailyStats;
    } catch (error) {
      throw error;
    }
  },

  // Get drone utilization stats
  getDroneUtilization: async () => {
    try {
      const response = await apiService.get("/analytics/drone-utilization");
      return response.utilizationStats;
    } catch (error) {
      throw error;
    }
  },

  // Get fleet status distribution
  getFleetStatus: async () => {
    try {
      const response = await apiService.get("/analytics/fleet-status");
      return response.statusDistribution;
    } catch (error) {
      throw error;
    }
  },

  // Export analytics data
  exportData: async (type, startDate, endDate, format = "json") => {
    try {
      const params = { startDate, endDate, format };
      const response = await apiService.get(
        `/analytics/export/${type}`,
        params
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get performance metrics
  getPerformanceMetrics: async (period = "7d") => {
    try {
      const response = await apiService.get("/analytics/performance", {
        period,
      });
      return response.metrics;
    } catch (error) {
      throw error;
    }
  },

  // Get revenue analytics
  getRevenueAnalytics: async (period = "30d") => {
    try {
      const response = await apiService.get("/analytics/revenue", { period });
      return response.revenue;
    } catch (error) {
      throw error;
    }
  },
};
