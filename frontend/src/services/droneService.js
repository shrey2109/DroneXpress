import { apiService } from "./api";

export const droneService = {
  // Get all drones
  getDrones: async (params = {}) => {
    try {
      const response = await apiService.get("/drones", params);
      return response.drones;
    } catch (error) {
      throw error;
    }
  },

  // Get drone by ID
  getDrone: async (droneId) => {
    try {
      const response = await apiService.get(`/drones/${droneId}`);
      return response.drone;
    } catch (error) {
      throw error;
    }
  },

  // Create new drone (admin only)
  createDrone: async (droneData) => {
    try {
      const response = await apiService.post("/drones", droneData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update drone
  updateDrone: async (droneId, droneData) => {
    try {
      const response = await apiService.put(`/drones/${droneId}`, droneData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete drone (admin only)
  deleteDrone: async (droneId) => {
    try {
      const response = await apiService.delete(`/drones/${droneId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update drone location
  updateDroneLocation: async (droneId, locationData) => {
    try {
      const response = await apiService.patch(
        `/drones/${droneId}/location`,
        locationData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get drone telemetry
  getDroneTelemetry: async (droneId, limit = 50) => {
    try {
      const response = await apiService.get(`/drones/${droneId}/telemetry`, {
        limit,
      });
      return response.telemetry;
    } catch (error) {
      throw error;
    }
  },

  // Get drone fleet status
  getFleetStatus: async () => {
    try {
      const response = await apiService.get("/drones/fleet/status");
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get available drones for assignment
  getAvailableDrones: async (packageWeight = 0) => {
    try {
      const response = await apiService.get("/drones", {
        status: "AVAILABLE",
        minCapacity: packageWeight,
      });
      return response.drones;
    } catch (error) {
      throw error;
    }
  },
};
