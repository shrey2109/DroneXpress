import { apiService } from "./api";

export const orderService = {
  // Create new order
  createOrder: async (orderData) => {
    try {
      const response = await apiService.post("/orders", orderData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get all orders (with pagination and filters)
  getOrders: async (params = {}) => {
    try {
      const response = await apiService.get("/orders", params);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get order by ID or tracking code
  getOrder: async (identifier) => {
    try {
      const response = await apiService.get(`/orders/${identifier}`);
      return response.order;
    } catch (error) {
      throw error;
    }
  },

  // Track order by tracking code
  trackOrder: async (trackingCode) => {
    try {
      const response = await apiService.get(`/orders/${trackingCode}`);
      return response.order;
    } catch (error) {
      throw error;
    }
  },

  // Update order status (admin/operator only)
  updateOrderStatus: async (orderId, status, reason = "") => {
    try {
      const response = await apiService.patch(`/orders/${orderId}/status`, {
        status,
        reason,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Cancel order
  cancelOrder: async (orderId, reason = "") => {
    try {
      const response = await apiService.patch(`/orders/${orderId}/status`, {
        status: "CANCELLED",
        reason,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get order tracking events
  getOrderTracking: async (orderId) => {
    try {
      const response = await apiService.get(`/orders/${orderId}/tracking`);
      return response.trackingEvents;
    } catch (error) {
      throw error;
    }
  },

  // Get customer orders
  getCustomerOrders: async (params = {}) => {
    try {
      const response = await apiService.get("/orders", {
        ...params,
        customer: true,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Calculate delivery estimate
  calculateDeliveryEstimate: async (
    pickupCoords,
    deliveryCoords,
    urgency = "STANDARD"
  ) => {
    try {
      const response = await apiService.post("/orders/estimate", {
        pickupLatitude: pickupCoords.lat,
        pickupLongitude: pickupCoords.lng,
        deliveryLatitude: deliveryCoords.lat,
        deliveryLongitude: deliveryCoords.lng,
        urgency,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};
