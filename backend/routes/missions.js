const express = require("express");
const Joi = require("joi");
const { PrismaClient } = require("@prisma/client");
const MissionService = require("../services/MissionService");

const router = express.Router();
const prisma = new PrismaClient();

// Get all missions
router.get("/", async (req, res, next) => {
  try {
    const { status, droneId, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status.toUpperCase();
    if (droneId) where.droneId = droneId;

    // Role-based filtering
    if (req.user.role === "OPERATOR") {
      where.drone = { operatorId: req.user.id };
    }

    const missions = await prisma.mission.findMany({
      where,
      include: {
        order: {
          include: {
            customer: { select: { name: true, email: true } },
          },
        },
        drone: {
          select: { id: true, name: true, status: true, battery: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.mission.count({ where });

    res.json({
      missions,
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

// Get mission by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const mission = await prisma.mission.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: { select: { name: true, email: true } },
          },
        },
        drone: {
          include: {
            telemetry: {
              orderBy: { timestamp: "desc" },
              take: 10,
            },
          },
        },
      },
    });

    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }

    // Role-based access control
    if (
      req.user.role === "OPERATOR" &&
      mission.drone.operatorId !== req.user.id
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ mission });
  } catch (error) {
    next(error);
  }
});

// Mission control actions (pause, resume, abort)
router.patch("/:id/control", async (req, res, next) => {
  try {
    if (!["ADMIN", "OPERATOR"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Admin or Operator access required" });
    }

    const { id } = req.params;
    const { action, reason } = req.body;

    const validActions = ["pause", "resume", "abort"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const mission = await MissionService.controlMission(
      id,
      action,
      reason,
      req.user.id
    );

    res.json({
      message: `Mission ${action}d successfully`,
      mission,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
