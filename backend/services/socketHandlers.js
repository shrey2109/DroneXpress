const { PrismaClient } = require("@prisma/client");
const MissionService = require("./MissionService");

const prisma = new PrismaClient();

const socketHandlers = {
  handleConnection: (socket, io) => {
    // Join role-based rooms
    socket.on("join-room", (data) => {
      const { role, userId } = data;
      socket.join(role.toLowerCase());
      socket.userId = userId;
      socket.role = role;

      console.log(`User ${userId} joined ${role} room`);
    });

    // Track specific order
    socket.on("track-order", async (orderId) => {
      try {
        socket.join(`order-${orderId}`);

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            drone: true,
            trackingEvents: { orderBy: { timestamp: "desc" }, take: 10 },
          },
        });

        if (order) {
          socket.emit("order-update", order);
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to track order" });
      }
    });

    // Monitor specific drone
    socket.on("monitor-drone", async (droneId) => {
      try {
        socket.join(`drone-${droneId}`);

        const drone = await prisma.drone.findUnique({
          where: { id: droneId },
          include: {
            telemetry: { orderBy: { timestamp: "desc" }, take: 1 },
            orders: {
              where: {
                status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] },
              },
              take: 1,
            },
          },
        });

        if (drone) {
          socket.emit("drone-update", drone);
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to monitor drone" });
      }
    });

    // Mission control commands
    socket.on("mission-control", async (data) => {
      try {
        if (!["admin", "operator"].includes(socket.role?.toLowerCase())) {
          return socket.emit("error", { message: "Insufficient permissions" });
        }

        const { missionId, action, reason } = data;
        const mission = await MissionService.controlMission(
          missionId,
          action,
          reason,
          socket.userId
        );

        // Notify relevant parties
        io.to("admin").to("operator").emit("mission-update", {
          missionId,
          action,
          status: mission.status,
          timestamp: new Date(),
        });

        // Notify customer tracking this order
        io.to(`order-${mission.orderId}`).emit("order-status-change", {
          orderId: mission.orderId,
          status: mission.order.status,
          message: `Mission ${action}ed`,
          timestamp: new Date(),
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // Real-time chat/notifications
    socket.on("send-notification", (data) => {
      const { targetRole, message, type } = data;

      io.to(targetRole.toLowerCase()).emit("notification", {
        from: socket.userId,
        message,
        type,
        timestamp: new Date(),
      });
    });

    // Disconnect handling
    socket.on("disconnect", () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  },

  // Broadcast system-wide notifications
  broadcastAlert: (io, type, message, data = {}) => {
    io.emit("system-alert", {
      type,
      message,
      data,
      timestamp: new Date(),
    });
  },

  // Notify specific order updates
  notifyOrderUpdate: (io, orderId, update) => {
    io.to(`order-${orderId}`).emit("order-update", {
      orderId,
      ...update,
      timestamp: new Date(),
    });
  },

  // Notify drone location updates
  notifyDroneUpdate: (io, droneId, update) => {
    io.to(`drone-${droneId}`)
      .to("admin")
      .to("operator")
      .emit("drone-location-update", {
        droneId,
        ...update,
        timestamp: new Date(),
      });
  },
};

module.exports = socketHandlers;
