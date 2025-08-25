const express = require("express");
const Joi = require("joi");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createDroneSchema = Joi.object({
  name: Joi.string().required(),
  model: Joi.string().required(),
  capacity: Joi.number().positive().required(),
  homeLatitude: Joi.number().required(),
  homeLongitude: Joi.number().required(),
});

const updateDroneSchema = Joi.object({
  name: Joi.string(),
  model: Joi.string(),
  capacity: Joi.number().positive(),
  status: Joi.string().valid(
    "AVAILABLE",
    "DELIVERING",
    "CHARGING",
    "MAINTENANCE",
    "OFFLINE"
  ),
  operatorId: Joi.string().allow(null),
});

// Get all drones
router.get("/", async (req, res, next) => {
  try {
    const { status, operatorId } = req.query;

    const where = {};
    if (status) where.status = status.toUpperCase();
    if (operatorId) where.operatorId = operatorId;

    // Operators can only see their assigned drones
    if (req.user.role === "OPERATOR") {
      where.operatorId = req.user.id;
    }

    const drones = await prisma.drone.findMany({
      where,
      include: {
        operator: { select: { id: true, name: true, email: true } },
        orders: {
          where: { status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] } },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        telemetry: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ drones });
  } catch (error) {
    next(error);
  }
});

// Get drone by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const drone = await prisma.drone.findUnique({
      where: { id },
      include: {
        operator: { select: { id: true, name: true, email: true } },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            customer: { select: { name: true, email: true } },
          },
        },
        telemetry: {
          orderBy: { timestamp: "desc" },
          take: 50,
        },
        missions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            order: { select: { id: true, trackingCode: true, status: true } },
          },
        },
      },
    });

    if (!drone) {
      return res.status(404).json({ error: "Drone not found" });
    }

    // Operators can only see their assigned drones
    if (req.user.role === "OPERATOR" && drone.operatorId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ drone });
  } catch (error) {
    next(error);
  }
});

// Create drone (Admin only)
router.post("/", async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { error, value } = createDroneSchema.validate(req.body);
    if (error) return next(error);

    const drone = await prisma.drone.create({
      data: {
        ...value,
        latitude: value.homeLatitude,
        longitude: value.homeLongitude,
      },
    });

    res.status(201).json({ message: "Drone created successfully", drone });
  } catch (error) {
    next(error);
  }
});

// Update drone
router.put("/:id", async (req, res, next) => {
  try {
    if (!["ADMIN", "OPERATOR"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Admin or Operator access required" });
    }

    const { id } = req.params;
    const { error, value } = updateDroneSchema.validate(req.body);
    if (error) return next(error);

    // Check if drone exists and access permissions
    const existingDrone = await prisma.drone.findUnique({ where: { id } });
    if (!existingDrone) {
      return res.status(404).json({ error: "Drone not found" });
    }

    if (
      req.user.role === "OPERATOR" &&
      existingDrone.operatorId !== req.user.id
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const drone = await prisma.drone.update({
      where: { id },
      data: value,
      include: {
        operator: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ message: "Drone updated successfully", drone });
  } catch (error) {
    next(error);
  }
});

// Delete drone (Admin only)
router.delete("/:id", async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;

    // Check if drone has active orders
    const activeOrders = await prisma.order.count({
      where: {
        droneId: id,
        status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] },
      },
    });

    if (activeOrders > 0) {
      return res.status(409).json({
        error: "Cannot delete drone with active orders",
      });
    }

    await prisma.drone.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: "Drone deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Update drone location (for simulation)
router.patch("/:id/location", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, battery, altitude = 50, speed = 0 } = req.body;

    await prisma.drone.update({
      where: { id },
      data: { latitude, longitude, battery },
    });

    // Record telemetry
    await prisma.droneTelemetry.create({
      data: {
        droneId: id,
        latitude,
        longitude,
        altitude,
        battery,
        speed,
        temperature: 25 + Math.random() * 10,
        humidity: 40 + Math.random() * 20,
      },
    });

    res.json({ message: "Location updated" });
  } catch (error) {
    next(error);
  }
});

// Get fleet status (for operators and admins)
router.get("/fleet-status", async (req, res, next) => {
  try {
    const where = { isActive: true };
    
    // Operators can only see their assigned drones
    if (req.user.role === "OPERATOR") {
      where.operatorId = req.user.id;
    }

    const drones = await prisma.drone.findMany({
      where,
      include: {
        operator: { select: { id: true, name: true, email: true } },
        telemetry: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
        orders: {
          where: { status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] } },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate fleet statistics
    const totalDrones = drones.length;
    const availableDrones = drones.filter(d => d.status === "AVAILABLE").length;
    const deliveringDrones = drones.filter(d => d.status === "DELIVERING").length;
    const chargingDrones = drones.filter(d => d.status === "CHARGING").length;
    const maintenanceDrones = drones.filter(d => d.status === "MAINTENANCE").length;

    res.json({
      drones,
      statistics: {
        total: totalDrones,
        available: availableDrones,
        delivering: deliveringDrones,
        charging: chargingDrones,
        maintenance: maintenanceDrones,
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
