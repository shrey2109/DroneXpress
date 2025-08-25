const { PrismaClient } = require("@prisma/client");
const MissionService = require("./MissionService");

const prisma = new PrismaClient();

class DroneService {
  static async autoAssignDrone(orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) throw new Error("Order not found");

      // Find available drones with sufficient capacity and battery
      const availableDrones = await prisma.drone.findMany({
        where: {
          status: "AVAILABLE",
          isActive: true,
          capacity: { gte: order.packageWeight },
          battery: { gte: 30 }, // Minimum 30% battery
        },
        include: {
          telemetry: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
      });

      if (availableDrones.length === 0) {
        return null; // No available drones
      }

      // Calculate distances and find closest drone
      const dronesWithDistance = availableDrones.map((drone) => {
        const distance = this.calculateDistance(
          drone.latitude || drone.homeLatitude,
          drone.longitude || drone.homeLongitude,
          order.pickupLatitude,
          order.pickupLongitude
        );
        return { ...drone, distanceToPickup: distance };
      });

      // Sort by distance and battery level
      dronesWithDistance.sort((a, b) => {
        const scoreA = a.distanceToPickup * 0.7 + (100 - a.battery) * 0.3;
        const scoreB = b.distanceToPickup * 0.7 + (100 - b.battery) * 0.3;
        return scoreA - scoreB;
      });

      const selectedDrone = dronesWithDistance[0];

      // Assign drone to order
      await prisma.order.update({
        where: { id: orderId },
        data: {
          droneId: selectedDrone.id,
          status: "ASSIGNED",
        },
      });

      // Update drone status
      await prisma.drone.update({
        where: { id: selectedDrone.id },
        data: { status: "DELIVERING" },
      });

      // Create mission
      const mission = await MissionService.createMission(
        orderId,
        selectedDrone.id
      );

      // Create tracking event
      await prisma.trackingEvent.create({
        data: {
          orderId,
          event: "ASSIGNED",
          description: `Assigned to drone ${selectedDrone.name}`,
          location: selectedDrone.name,
        },
      });

      return selectedDrone;
    } catch (error) {
      console.error("Auto-assign error:", error);
      throw error;
    }
  }

  static async updateDroneLocation(droneId, latitude, longitude, battery) {
    try {
      await prisma.drone.update({
        where: { id: droneId },
        data: { latitude, longitude, battery },
      });

      // Record telemetry
      await prisma.droneTelemetry.create({
        data: {
          droneId,
          latitude,
          longitude,
          altitude: 50 + Math.random() * 50,
          battery,
          speed: 15 + Math.random() * 20,
          temperature: 20 + Math.random() * 15,
          humidity: 40 + Math.random() * 30,
        },
      });

      return true;
    } catch (error) {
      console.error("Update location error:", error);
      throw error;
    }
  }

  static calculateDistance(lat1, lon1, lat2, lon2) {
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
    return R * c;
  }

  static async initializeSimulation(io) {
    console.log("Initializing drone simulation...");

    setInterval(async () => {
      try {
        const activeDrones = await prisma.drone.findMany({
          where: {
            status: { in: ["DELIVERING", "AVAILABLE"] },
            isActive: true,
          },
          include: {
            orders: {
              where: {
                status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] },
              },
              take: 1,
            },
          },
        });

        for (const drone of activeDrones) {
          // Simulate movement and battery drain
          const newLat = drone.latitude + (Math.random() - 0.5) * 0.001;
          const newLng = drone.longitude + (Math.random() - 0.5) * 0.001;
          const newBattery = Math.max(0, drone.battery - Math.random() * 2);

          await this.updateDroneLocation(
            drone.id,
            newLat,
            newLng,
            Math.floor(newBattery)
          );

          // Emit real-time updates
          io.emit("droneLocationUpdate", {
            droneId: drone.id,
            latitude: newLat,
            longitude: newLng,
            battery: Math.floor(newBattery),
            timestamp: new Date(),
          });

          // Check if battery is low
          if (newBattery < 20 && drone.status !== "CHARGING") {
            await prisma.drone.update({
              where: { id: drone.id },
              data: { status: "CHARGING" },
            });

            io.emit("droneAlert", {
              droneId: drone.id,
              type: "LOW_BATTERY",
              message: `Drone ${drone.name} has low battery (${Math.floor(
                newBattery
              )}%)`,
              timestamp: new Date(),
            });
          }
        }
      } catch (error) {
        console.error("Simulation error:", error);
      }
    }, 5000); // Update every 5 seconds
  }
}

module.exports = DroneService;
