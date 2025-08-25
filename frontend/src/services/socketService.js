import { io } from "socket.io-client";
import toast from "react-hot-toast";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const token = localStorage.getItem("authToken");
    const socketUrl =
      process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

    this.socket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ["websocket"],
      upgrade: true,
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
      this.isConnected = true;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      this.isConnected = false;

      if (reason === "io server disconnect") {
        // Reconnect manually if server disconnected the socket
        this.socket.connect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Connection error. Some features may not work properly.");
    });

    // Drone location updates
    this.socket.on("droneLocationUpdate", (data) => {
      this.emit("droneLocationUpdate", data);
    });

    // Order status updates
    this.socket.on("orderStatusUpdate", (data) => {
      this.emit("orderStatusUpdate", data);
      toast.success(`Order ${data.trackingCode} status: ${data.status}`);
    });

    // Mission updates
    this.socket.on("missionUpdate", (data) => {
      this.emit("missionUpdate", data);
    });

    // Drone alerts
    this.socket.on("droneAlert", (data) => {
      this.emit("droneAlert", data);

      if (data.type === "LOW_BATTERY") {
        toast.error(data.message, { duration: 6000 });
      } else if (data.type === "MAINTENANCE_REQUIRED") {
        toast.warning(data.message, { duration: 6000 });
      }
    });

    // Fleet status updates
    this.socket.on("fleetStatusUpdate", (data) => {
      this.emit("fleetStatusUpdate", data);
    });

    // New order notifications (for operators/admins)
    this.socket.on("newOrder", (data) => {
      this.emit("newOrder", data);
      toast.success(`New order received: ${data.trackingCode}`);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // Unsubscribe from events
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // Emit events to subscribers
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event handler for ${event}:`, error);
        }
      });
    }
  }

  // Send data to server
  send(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Socket not connected. Cannot send:", event, data);
    }
  }

  // Join a room (for role-based updates)
  joinRoom(room) {
    this.send("join", { room });
  }

  // Leave a room
  leaveRoom(room) {
    this.send("leave", { room });
  }

  // Subscribe to drone updates
  subscribeToDrone(droneId) {
    this.send("subscribeDrone", { droneId });
  }

  // Unsubscribe from drone updates
  unsubscribeFromDrone(droneId) {
    this.send("unsubscribeDrone", { droneId });
  }

  // Subscribe to order updates
  subscribeToOrder(orderId) {
    this.send("subscribeOrder", { orderId });
  }

  // Unsubscribe from order updates
  unsubscribeFromOrder(orderId) {
    this.send("unsubscribeOrder", { orderId });
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
