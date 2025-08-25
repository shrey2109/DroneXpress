class DroneSimulationService {
  constructor() {
    this.drones = [];
    this.simulationInterval = null;
    this.subscribers = [];
    this.isRunning = false;
  }

  // Initialize drone simulation
  initializeDrones(drones) {
    this.drones = drones.map(drone => ({
      ...drone,
      latitude: drone.latitude || (40.7128 + (Math.random() - 0.5) * 0.02),
      longitude: drone.longitude || (-74.0060 + (Math.random() - 0.5) * 0.02),
      altitude: drone.altitude || (50 + Math.random() * 100),
      heading: drone.heading || (Math.random() * 360),
      speed: drone.speed || (10 + Math.random() * 20),
      lastUpdate: new Date(),
    }));
  }

  // Start simulation
  startSimulation() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.simulationInterval = setInterval(() => {
      this.updateDronePositions();
      this.updateDroneStatus();
      this.notifySubscribers();
    }, 2000); // Update every 2 seconds
  }

  // Stop simulation
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isRunning = false;
  }

  // Update drone positions
  updateDronePositions() {
    this.drones.forEach(drone => {
      if (drone.status === "DELIVERING" || drone.status === "AVAILABLE") {
        // Simulate movement
        const speedKmH = drone.speed;
        const speedDegrees = speedKmH / 111000; // Convert km/h to degrees (roughly)
        const timeElapsed = (new Date() - drone.lastUpdate) / 1000 / 3600; // hours
        
        const distance = speedDegrees * timeElapsed;
        const headingRad = (drone.heading * Math.PI) / 180;
        
        drone.latitude += distance * Math.cos(headingRad);
        drone.longitude += distance * Math.sin(headingRad);
        
        // Keep drones within bounds (roughly NYC area)
        drone.latitude = Math.max(40.5, Math.min(41.0, drone.latitude));
        drone.longitude = Math.max(-74.3, Math.min(-73.7, drone.longitude));
        
        // Randomly change heading occasionally
        if (Math.random() < 0.1) {
          drone.heading += (Math.random() - 0.5) * 30;
          if (drone.heading < 0) drone.heading += 360;
          if (drone.heading >= 360) drone.heading -= 360;
        }
        
        drone.lastUpdate = new Date();
      }
    });
  }

  // Update drone status
  updateDroneStatus() {
    this.drones.forEach(drone => {
      // Simulate battery drain
      if (drone.status === "DELIVERING") {
        drone.battery = Math.max(0, drone.battery - Math.random() * 0.5);
        if (drone.battery < 20) {
          drone.status = "CHARGING";
        }
      } else if (drone.status === "CHARGING") {
        drone.battery = Math.min(100, drone.battery + Math.random() * 2);
        if (drone.battery >= 80) {
          drone.status = "AVAILABLE";
        }
      }
      
      // Random status changes
      if (Math.random() < 0.01) { // 1% chance per update
        const statuses = ["AVAILABLE", "DELIVERING", "CHARGING", "MAINTENANCE"];
        drone.status = statuses[Math.floor(Math.random() * statuses.length)];
      }
    });
  }

  // Subscribe to updates
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify subscribers
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      callback(this.drones);
    });
  }

  // Get current drone data
  getDrones() {
    return this.drones;
  }

  // Update specific drone
  updateDrone(droneId, updates) {
    const droneIndex = this.drones.findIndex(d => d.id === droneId);
    if (droneIndex !== -1) {
      this.drones[droneIndex] = { ...this.drones[droneIndex], ...updates };
      this.notifySubscribers();
    }
  }

  // Assign order to drone
  assignOrderToDrone(droneId, order) {
    const drone = this.drones.find(d => d.id === droneId);
    if (drone && drone.status === "AVAILABLE") {
      drone.status = "DELIVERING";
      drone.currentOrder = order.trackingCode || order.id;
      drone.destinationLatitude = order.deliveryLatitude;
      drone.destinationLongitude = order.deliveryLongitude;
      
      // Calculate heading to destination
      const latDiff = order.deliveryLatitude - drone.latitude;
      const lngDiff = order.deliveryLongitude - drone.longitude;
      drone.heading = Math.atan2(lngDiff, latDiff) * 180 / Math.PI;
      
      this.notifySubscribers();
      return true;
    }
    return false;
  }
}

// Create singleton instance
const droneSimulationService = new DroneSimulationService();

export default droneSimulationService;
