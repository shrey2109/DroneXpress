import React, { useState, useEffect } from "react";
import { MapPin, Battery, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { droneService } from "../../services/droneService";
import { useSocket } from "../../context/SocketContext";
import { useTheme } from "../../context/ThemeContext";
import droneSimulationService from "../../services/droneSimulationService";
import toast from "react-hot-toast";
import MapComponent from "../dashboard/MapComponent";

const FleetMonitor = () => {
  const [drones, setDrones] = useState([]);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { darkMode } = useTheme();
  const { on, off } = useSocket();

  useEffect(() => {
    loadFleetData();
    setupSocketListeners();

    // Start drone simulation
    droneSimulationService.startSimulation();

    return () => {
      cleanupSocketListeners();
      droneSimulationService.stopSimulation();
    };
  }, []);

  const setupSocketListeners = () => {
    const handleDroneUpdate = (data) => {
      setDrones(prev => 
        prev.map(drone => 
          drone.id === data.droneId 
            ? { ...drone, ...data.updates }
            : drone
        )
      );
      setLastUpdate(new Date());
    };

    const handleDroneAlert = (data) => {
      toast.error(`Drone ${data.droneId}: ${data.message}`);
    };

    on("droneLocationUpdate", handleDroneUpdate);
    on("droneAlert", handleDroneAlert);

    return () => {
      off("droneLocationUpdate", handleDroneUpdate);
      off("droneAlert", handleDroneAlert);
    };
  };

  const cleanupSocketListeners = () => {
    off("droneLocationUpdate");
    off("droneAlert");
  };

  const loadFleetData = async () => {
    setIsLoading(true);
    try {
      const fleetStatus = await droneService.getFleetStatus();
      const fleetData = fleetStatus.drones || [];
      setDrones(fleetData);
      
      // Initialize simulation with real drone data
      droneSimulationService.initializeDrones(fleetData);
      
      // Subscribe to simulation updates
      const unsubscribe = droneSimulationService.subscribe((updatedDrones) => {
        setDrones(updatedDrones);
        setLastUpdate(new Date());
      });
      
    } catch (error) {
      console.error("Failed to load fleet data:", error);
      toast.error("Failed to load fleet data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadFleetData();
  };

  const getStatusColor = (status) => {
    const colors = {
      AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      DELIVERING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      CHARGING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      MAINTENANCE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      OFFLINE: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    };
    return colors[status] || colors.OFFLINE;
  };

  const getBatteryColor = (battery) => {
    if (battery > 60) return "text-green-600";
    if (battery > 30) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fleet Monitor
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time drone fleet monitoring and status
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Live Map */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Fleet Map
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Live Updates
            </span>
          </div>
        </div>
        <div className="h-96">
          <MapComponent
            drones={drones}
            orders={[
              {
                id: "order-1",
                trackingCode: "DD-001",
                pickupAddress: "123 Main St, NYC",
                deliveryAddress: "456 Park Ave, NYC",
                pickupLatitude: 40.7589,
                pickupLongitude: -73.9851,
                deliveryLatitude: 40.7505,
                deliveryLongitude: -73.9934,
                status: "IN_TRANSIT",
                packageWeight: 2.5
              },
              {
                id: "order-2", 
                trackingCode: "DD-002",
                pickupAddress: "789 Broadway, NYC",
                deliveryAddress: "321 5th Ave, NYC",
                pickupLatitude: 40.7484,
                pickupLongitude: -73.9857,
                deliveryLatitude: 40.7527,
                deliveryLongitude: -73.9772,
                status: "PENDING",
                packageWeight: 1.8
              }
            ]}
            selectedDrone={selectedDrone}
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* Fleet Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drone Status Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Drone Status
          </h3>
          <div className="space-y-4">
            {drones.map((drone) => (
              <div
                key={drone.id}
                onClick={() => setSelectedDrone(selectedDrone === drone.id ? null : drone.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedDrone === drone.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {drone.name}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {drone.id}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        drone.status
                      )}`}
                    >
                      {drone.status}
                    </span>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        drone.status === "AVAILABLE"
                          ? "bg-green-500"
                          : drone.status === "DELIVERING"
                          ? "bg-blue-500 animate-pulse"
                          : drone.status === "CHARGING"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <Battery className={`w-3 h-3 mr-1 ${getBatteryColor(drone.battery)}`} />
                    <span className={getBatteryColor(drone.battery)}>
                      {drone.battery}%
                    </span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{drone.currentLocation || "Unknown"}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{drone.flightTime || 0}h</span>
                  </div>
                  <div className="flex items-center">
                    <span>Capacity: {drone.capacity}kg</span>
                  </div>
                </div>
                {drone.currentOrder && (
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Current Order: {drone.currentOrder}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Fleet Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Available
                </span>
              </div>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {drones.filter(d => d.status === "AVAILABLE").length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Delivering
                </span>
              </div>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {drones.filter(d => d.status === "DELIVERING").length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Charging
                </span>
              </div>
              <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {drones.filter(d => d.status === "CHARGING").length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Maintenance
                </span>
              </div>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {drones.filter(d => d.status === "MAINTENANCE").length}
              </span>
            </div>
          </div>

          {/* Alerts */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Recent Alerts
            </h4>
            <div className="space-y-2">
              {drones.filter(d => d.battery < 30).map(drone => (
                <div key={drone.id} className="flex items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-xs text-red-700 dark:text-red-300">
                    {drone.name}: Low battery ({drone.battery}%)
                  </span>
                </div>
              ))}
              {drones.filter(d => d.battery < 30).length === 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  No active alerts
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetMonitor;
