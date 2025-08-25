const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class MissionService {
  static async createMission(orderId, droneId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      const drone = await prisma.drone.findUnique({
        where: { id: droneId },
      });

      if (!order || !drone) {
        throw new Error("Order or drone not found");
      }

      // Generate mission route
      const route = this.generateRoute(
        drone.latitude || drone.homeLatitude,
        drone.longitude || drone.homeLongitude,
        order.pickupLatitude,
        order.pickupLongitude,
        order.deliveryLatitude,
        order.deliveryLongitude
      );

      // Calculate estimated duration
      const totalDistance = this.calculateRouteDistance(route);
      const estimatedDuration = Math.ceil(totalDistance / 0.5); // Assuming 30 km/h average speed

      const mission = await prisma.mission.create({
        data: {
          orderId,
          droneId,
          route,
          totalSteps: route.length,
          estimatedDuration,
          status: "ASSIGNED",
        },
        include: {
          order: true,
          drone: true,
        },
      });

      return mission;
    } catch (error) {
      console.error("Create mission error:", error);
      throw error;
    }
  }

  static async controlMission(missionId, action, reason, operatorId) {
    try {
      const mission = await prisma.mission.findUnique({
        where: { id: missionId },
        include: { drone: true, order: true },
      });

      if (!mission) {
        throw new Error("Mission not found");
      }

      let newStatus;
      let droneStatus;
      let orderStatus;

      switch (action) {
        case "pause":
          newStatus = "PAUSED";
          droneStatus = "AVAILABLE";
          break;
        case "resume":
          newStatus = "IN_PROGRESS";
          droneStatus = "DELIVERING";
          break;
        case "abort":
          newStatus = "ABORTED";
          droneStatus = "AVAILABLE";
          orderStatus = "CANCELLED";
          break;
        default:
          throw new Error("Invalid action");
      }

      // Update mission
      const updatedMission = await prisma.mission.update({
        where: { id: missionId },
        data: {
          status: newStatus,
          failureReason: action === "abort" ? reason : null,
          endTime: action === "abort" ? new Date() : null,
        },
        include: { drone: true, order: true },
      });

      // Update drone status
      await prisma.drone.update({
        where: { id: mission.droneId },
        data: { status: droneStatus },
      });

      // Update order status if needed
      if (orderStatus) {
        await prisma.order.update({
          where: { id: mission.orderId },
          data: { status: orderStatus },
        });

        // Create tracking event
        await prisma.trackingEvent.create({
          data: {
            orderId: mission.orderId,
            event: orderStatus,
            description: reason || `Mission ${action}ed by operator`,
            location: "Control Center",
          },
        });
      }

      return updatedMission;
    } catch (error) {
      console.error("Control mission error:", error);
      throw error;
    }
  }

  static async updateMissionProgress(missionId, currentStep) {
    try {
      const mission = await prisma.mission.update({
        where: { id: missionId },
        data: {
          currentStep,
          status: "IN_PROGRESS",
          startTime: { not: null } ? undefined : new Date(),
        },
        include: { order: true, drone: true },
      });

      // Update order status based on mission progress
      let orderStatus = mission.order.status;
      if (currentStep === 1 && orderStatus === "ASSIGNED") {
        orderStatus = "PICKED_UP";
      } else if (currentStep === mission.totalSteps - 1) {
        orderStatus = "IN_TRANSIT";
      } else if (currentStep === mission.totalSteps) {
        orderStatus = "DELIVERED";
        mission.endTime = new Date();
        mission.actualDuration = Math.ceil(
          (new Date() - mission.startTime) / (1000 * 60)
        );
      }

      // Update order if status changed
      if (orderStatus !== mission.order.status) {
        await prisma.order.update({
          where: { id: mission.orderId },
          data: {
            status: orderStatus,
            actualDelivery:
              orderStatus === "DELIVERED" ? new Date() : undefined,
          },
        });

        // Create tracking event
        await prisma.trackingEvent.create({
          data: {
            orderId: mission.orderId,
            event: orderStatus,
            description: this.getStatusDescription(
              orderStatus,
              mission.drone.name
            ),
            location: mission.drone.name,
          },
        });
      }

      // Complete mission if at final step
      if (currentStep >= mission.totalSteps) {
        await prisma.mission.update({
          where: { id: missionId },
          data: {
            status: "COMPLETED",
            endTime: new Date(),
            actualDuration: Math.ceil(
              (new Date() - mission.startTime) / (1000 * 60)
            ),
          },
        });

        // Return drone to base and make available
        await prisma.drone.update({
          where: { id: mission.droneId },
          data: {
            status: "AVAILABLE",
            latitude: mission.drone.homeLatitude,
            longitude: mission.drone.homeLongitude,
          },
        });
      }

      return mission;
    } catch (error) {
      console.error("Update mission progress error:", error);
      throw error;
    }
  }

  static generateRoute(
    startLat,
    startLng,
    pickupLat,
    pickupLng,
    deliveryLat,
    deliveryLng
  ) {
    const route = [];

    // Add start point
    route.push({ lat: startLat, lng: startLng, type: "start" });

    // Add waypoints to pickup (simplified - in real app would use routing API)
    const pickupSteps = this.interpolatePoints(
      startLat,
      startLng,
      pickupLat,
      pickupLng,
      5
    );
    route.push(...pickupSteps);

    // Add pickup point
    route.push({ lat: pickupLat, lng: pickupLng, type: "pickup" });

    // Add waypoints to delivery
    const deliverySteps = this.interpolatePoints(
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
      8
    );
    route.push(...deliverySteps);

    // Add delivery point
    route.push({ lat: deliveryLat, lng: deliveryLng, type: "delivery" });

    // Add return to base waypoints
    const returnSteps = this.interpolatePoints(
      deliveryLat,
      deliveryLng,
      startLat,
      startLng,
      5
    );
    route.push(...returnSteps);

    // Add end point (base)
    route.push({ lat: startLat, lng: startLng, type: "end" });

    return route;
  }

  static interpolatePoints(lat1, lng1, lat2, lng2, steps) {
    const points = [];
    for (let i = 1; i <= steps; i++) {
      const ratio = i / (steps + 1);
      const lat = lat1 + (lat2 - lat1) * ratio;
      const lng = lng1 + (lng2 - lng1) * ratio;
      points.push({ lat, lng, type: "waypoint" });
    }
    return points;
  }

  static calculateRouteDistance(route) {
    let totalDistance = 0;
    for (let i = 1; i < route.length; i++) {
      const prev = route[i - 1];
      const curr = route[i];
      totalDistance += this.calculateDistance(
        prev.lat,
        prev.lng,
        curr.lat,
        curr.lng
      );
    }
    return totalDistance;
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

  static getStatusDescription(status, droneName) {
    const descriptions = {
      ASSIGNED: `Package assigned to ${droneName}`,
      PICKED_UP: `Package picked up by ${droneName}`,
      IN_TRANSIT: `Package in transit via ${droneName}`,
      DELIVERED: `Package delivered successfully by ${droneName}`,
      CANCELLED: `Delivery cancelled`,
      FAILED: `Delivery failed`,
    };
    return descriptions[status] || `Status updated to ${status}`;
  }
}

module.exports = MissionService;
