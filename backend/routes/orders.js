const express = require("express");
const Joi = require("joi");
const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");
const DroneService = require("../services/DroneService");

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createOrderSchema = Joi.object({
  pickupAddress: Joi.string().required(),
  deliveryAddress: Joi.string().required(),
  pickupLatitude: Joi.number().required(),
  pickupLongitude: Joi.number().required(),
  deliveryLatitude: Joi.number().required(),
  deliveryLongitude: Joi.number().required(),
  packageWeight: Joi.number().positive().required(),
  packageDescription: Joi.string().required(),
  deliveryInstructions: Joi.string().allow(""),
  urgency: Joi.string()
    .valid("STANDARD", "PRIORITY", "URGENT")
    .default("STANDARD"),
});

// Create order
router.post("/", async (req, res, next) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) return next(error);

    // Calculate delivery fee and distance
    const distance = calculateDistance(
      value.pickupLatitude,
      value.pickupLongitude,
      value.deliveryLatitude,
      value.deliveryLongitude
    );

    const deliveryFee = calculateDeliveryFee(
      distance,
      value.urgency,
      value.packageWeight
    );

    const order = await prisma.order.create({
      data: {
        ...value,
        customerId: req.user.id,
        trackingCode: `DD${Date.now()}${Math.random()
          .toString(36)
          .substr(2, 4)
          .toUpperCase()}`,
        totalDistance: distance,
        deliveryFee,
        estimatedDelivery: calculateEstimatedDelivery(value.urgency),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    // Try to auto-assign drone
    const assignedDrone = await DroneService.autoAssignDrone(order.id);

    res.status(201).json({
      message: "Order created successfully",
      order: {
        ...order,
        assignedDrone: assignedDrone ? assignedDrone.id : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get orders (with role-based filtering)
router.get("/", async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    // Role-based filtering
    if (req.user.role === "CUSTOMER") {
      where.customerId = req.user.id;
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        drone: { select: { id: true, name: true, status: true } },
        trackingEvents: { orderBy: { timestamp: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.order.count({ where });

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get order by ID or tracking code
router.get("/:identifier", async (req, res, next) => {
  try {
    const { identifier } = req.params;

    const where = identifier.startsWith("DD")
      ? { trackingCode: identifier }
      : { id: identifier };

    const order = await prisma.order.findFirst({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        drone: {
          select: {
            id: true,
            name: true,
            status: true,
            latitude: true,
            longitude: true,
            battery: true,
          },
        },
        trackingEvents: { orderBy: { timestamp: "desc" } },
        missions: {
          include: { drone: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Role-based access control
    if (req.user.role === "CUSTOMER" && order.customerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
});

// Update order status
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    // Only operators and admins can update order status
    if (!["ADMIN", "OPERATOR"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        actualDelivery:
          status.toUpperCase() === "DELIVERED" ? new Date() : undefined,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        drone: { select: { id: true, name: true } },
      },
    });

    // Create tracking event
    await prisma.trackingEvent.create({
      data: {
        orderId: id,
        event: status.toUpperCase(),
        description: reason || `Order status updated to ${status}`,
        location: order.drone?.name || "System",
      },
    });

    res.json({ message: "Order status updated", order });
  } catch (error) {
    next(error);
  }
});

// Utility functions
function calculateDistance(lat1, lon1, lat2, lon2) {
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

function calculateDeliveryFee(distance, urgency, weight) {
  let baseFee = 5.0;
  baseFee += distance * 0.5;
  baseFee += weight * 0.2;

  const multiplier = {
    STANDARD: 1,
    PRIORITY: 1.5,
    URGENT: 2,
  };

  return Math.round(baseFee * multiplier[urgency] * 100) / 100;
}

function calculateEstimatedDelivery(urgency) {
  const now = new Date();
  const minutes = {
    STANDARD: 35,
    PRIORITY: 20,
    URGENT: 12,
  };

  return new Date(now.getTime() + minutes[urgency] * 60000);
}

module.exports = router;
