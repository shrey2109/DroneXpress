require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Import routes
const authRoutes = require("./routes/auth");
const droneRoutes = require("./routes/drones");
const orderRoutes = require("./routes/orders");
const missionRoutes = require("./routes/missions");
const analyticsRoutes = require("./routes/analytics");
const userRoutes = require("./routes/user");

// Import middleware
const authMiddleware = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");

// Import services
const DroneService = require("./services/DroneService");
const socketHandlers = require("./services/socketHandlers");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/drones", authMiddleware, droneRoutes);
app.use("/api/orders", authMiddleware, orderRoutes);
app.use("/api/missions", authMiddleware, missionRoutes);
app.use("/api/analytics", authMiddleware, analyticsRoutes);
app.use("/api/users", authMiddleware, userRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socketHandlers.handleConnection(socket, io);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`DroneXpress API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);

  // Initialize drone simulation
  DroneService.initializeSimulation(io);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
