const express = require("express");
const { PrismaClient } = require("@prisma/client");
const moment = require("moment");

const router = express.Router();
const prisma = new PrismaClient();

// Admin access only for analytics
const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Dashboard KPIs
router.get("/dashboard", adminOnly, async (req, res, next) => {
  try {
    const today = moment().startOf("day");
    const yesterday = moment().subtract(1, "day").startOf("day");
    const weekAgo = moment().subtract(7, "days").startOf("day");
    const monthAgo = moment().subtract(30, "days").startOf("day");

    // Total deliveries
    const totalDeliveries = await prisma.order.count({
      where: { status: "DELIVERED" },
    });

    const todayDeliveries = await prisma.order.count({
      where: {
        status: "DELIVERED",
        actualDelivery: { gte: today.toDate() },
      },
    });

    const yesterdayDeliveries = await prisma.order.count({
      where: {
        status: "DELIVERED",
        actualDelivery: {
          gte: yesterday.toDate(),
          lt: today.toDate(),
        },
      },
    });

    // Active drones
    const activeDrones = await prisma.drone.count({
      where: {
        status: { not: "OFFLINE" },
        isActive: true,
      },
    });

    const totalDrones = await prisma.drone.count({
      where: { isActive: true },
    });

    // Average delivery time
    const avgDeliveryTime = await prisma.$queryRaw`
      SELECT AVG(EXTRACT(EPOCH FROM (actualDelivery - createdAt))/60) as avg_minutes
      FROM orders 
      WHERE status = 'DELIVERED' 
      AND actualDelivery IS NOT NULL 
      AND createdAt >= ${weekAgo.toDate()}
    `;

    // On-time rate
    const onTimeOrders = await prisma.order.count({
      where: {
        status: "DELIVERED",
        actualDelivery: { lte: prisma.order.fields.estimatedDelivery },
        createdAt: { gte: monthAgo.toDate() },
      },
    });

    const totalCompletedOrders = await prisma.order.count({
      where: {
        status: "DELIVERED",
        createdAt: { gte: monthAgo.toDate() },
      },
    });

    const onTimeRate =
      totalCompletedOrders > 0
        ? (onTimeOrders / totalCompletedOrders) * 100
        : 0;

    res.json({
      kpis: {
        totalDeliveries,
        todayDeliveries,
        deliveryGrowth:
          yesterdayDeliveries > 0
            ? ((todayDeliveries - yesterdayDeliveries) / yesterdayDeliveries) *
              100
            : 0,
        activeDrones,
        totalDrones,
        avgDeliveryTime: Math.round(avgDeliveryTime[0]?.avg_minutes || 0),
        onTimeRate: Math.round(onTimeRate * 10) / 10,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Daily delivery statistics
router.get("/daily-deliveries", adminOnly, async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = moment()
      .subtract(days - 1, "days")
      .startOf("day");

    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END)::int as deliveries,
        COUNT(CASE WHEN status = 'DELIVERED' AND actualDelivery <= estimatedDelivery THEN 1 END)::int as on_time,
        COUNT(CASE WHEN status = 'DELIVERED' AND actualDelivery > estimatedDelivery THEN 1 END)::int as delayed
      FROM orders 
      WHERE createdAt >= ${startDate.toDate()}
      GROUP BY DATE(createdAt)
      ORDER BY date
    `;

    res.json({ dailyStats });
  } catch (error) {
    next(error);
  }
});

// Drone utilization
router.get("/drone-utilization", adminOnly, async (req, res, next) => {
  try {
    const utilizationStats = await prisma.$queryRaw`
      SELECT 
        d.name,
        d.id,
        COUNT(m.id)::int as total_missions,
        AVG(CASE WHEN m.actualDuration IS NOT NULL THEN m.actualDuration END)::int as avg_duration,
        COUNT(CASE WHEN m.status = 'COMPLETED' THEN 1 END)::int as completed_missions
      FROM drones d
      LEFT JOIN missions m ON d.id = m.droneId AND m.createdAt >= ${moment()
        .subtract(30, "days")
        .toDate()}
      WHERE d.isActive = true
      GROUP BY d.id, d.name
      ORDER BY total_missions DESC
    `;

    res.json({ utilizationStats });
  } catch (error) {
    next(error);
  }
});

// Fleet status distribution
router.get("/fleet-status", adminOnly, async (req, res, next) => {
  try {
    const statusDistribution = await prisma.drone.groupBy({
      by: ["status"],
      where: { isActive: true },
      _count: { status: true },
    });

    const formattedData = statusDistribution.map((item) => ({
      name: item.status.toLowerCase().replace("_", " "),
      value: item._count.status,
    }));

    res.json({ statusDistribution: formattedData });
  } catch (error) {
    next(error);
  }
});

// Export reports
router.get("/export/:type", adminOnly, async (req, res, next) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, format = "json" } = req.query;

    let data = [];
    const start = startDate ? moment(startDate) : moment().subtract(30, "days");
    const end = endDate ? moment(endDate) : moment();

    switch (type) {
      case "orders":
        data = await prisma.order.findMany({
          where: {
            createdAt: {
              gte: start.toDate(),
              lte: end.toDate(),
            },
          },
          include: {
            customer: { select: { name: true, email: true } },
            drone: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        break;

      case "deliveries":
        data = await prisma.order.findMany({
          where: {
            status: "DELIVERED",
            actualDelivery: {
              gte: start.toDate(),
              lte: end.toDate(),
            },
          },
          include: {
            customer: { select: { name: true, email: true } },
            drone: { select: { name: true } },
          },
          orderBy: { actualDelivery: "desc" },
        });
        break;

      case "drones":
        data = await prisma.drone.findMany({
          where: { isActive: true },
          include: {
            operator: { select: { name: true, email: true } },
            orders: {
              where: {
                createdAt: {
                  gte: start.toDate(),
                  lte: end.toDate(),
                },
              },
            },
          },
        });
        break;

      default:
        return res.status(400).json({ error: "Invalid export type" });
    }

    if (format === "csv") {
      // Convert to CSV format
      const csv = convertToCSV(data, type);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${type}_${start.format(
          "YYYY-MM-DD"
        )}_${end.format("YYYY-MM-DD")}.csv`
      );
      return res.send(csv);
    }

    res.json({ data, count: data.length });
  } catch (error) {
    next(error);
  }
});

// Utility function to convert data to CSV
function convertToCSV(data, type) {
  if (!data.length) return "";

  const headers = Object.keys(data[0]).filter(
    (key) => typeof data[0][key] !== "object"
  );
  const csvRows = [headers.join(",")];

  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      return typeof value === "string"
        ? `"${value.replace(/"/g, '""')}"`
        : value;
    });
    csvRows.push(values.join(","));
  });

  return csvRows.join("\n");
}

module.exports = router;
