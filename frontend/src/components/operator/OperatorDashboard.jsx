import React, { useState, useEffect } from "react";
import { MapPin, Battery, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { droneService } from "../../services/droneService";
import { orderService } from "../../services/orderService";
import droneSimulationService from "../../services/droneSimulationService";
import MapComponent from "../dashboard/MapComponent";
import FleetMonitor from "./FleetMonitor";
import MissionControl from "./MissionControl";
import toast from "react-hot-toast";

const OperatorDashboard = ({ darkMode }) => {
  const [drones, setDrones] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [missionControl, setMissionControl] = useState({});

  useEffect(() => {
    loadDashboardData();
    
    // Start drone simulation
    droneSimulationService.startSimulation();
    
    return () => {
      droneSimulationService.stopSimulation();
    };
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [dronesResponse, ordersResponse] = await Promise.all([
        droneService.getDrones(),
        orderService.getOrders({ status: "PENDING,ASSIGNED,PICKED_UP,IN_TRANSIT" })
      ]);
      
      const fleetData = dronesResponse.drones || [];
      const orderData = ordersResponse.orders || [];
      
      setDrones(fleetData);
      setOrders(orderData);
      
      // Initialize simulation with real drone data
      droneSimulationService.initializeDrones(fleetData);
      
      // Subscribe to simulation updates
      const unsubscribe = droneSimulationService.subscribe((updatedDrones) => {
        setDrones(updatedDrones);
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMissionControl = async (droneId, action) => {
    try {
      let newStatus;
      switch (action) {
        case "pause":
          newStatus = "PAUSED";
          break;
        case "resume":
          newStatus = "IN_TRANSIT";
          break;
        case "abort":
          newStatus = "CANCELLED";
          break;
        default:
          return;
      }

      // Find the order associated with this drone
      const order = orders.find(o => o.droneId === droneId && 
        ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(o.status));
      
      if (order) {
        await orderService.updateOrderStatus(order.id, newStatus);
        toast.success(`Mission ${action}ed successfully`);
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to control mission:", error);
      toast.error("Failed to control mission");
    }
  };

  const handleAutoAssign = async (orderId) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // Get available drones
      const availableDrones = await droneService.getAvailableDrones(order.packageWeight);
      
      if (availableDrones.length === 0) {
        toast.error("No available drones for this order");
        return;
      }

      // Assign the first available drone
      const selectedDrone = availableDrones[0];
      await orderService.updateOrderStatus(orderId, "ASSIGNED", `Assigned to drone ${selectedDrone.name}`);
      
      toast.success(`Order assigned to ${selectedDrone.name}`);
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error("Failed to auto-assign order:", error);
      toast.error("Failed to auto-assign order");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      DELIVERING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      CHARGING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      MAINTENANCE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      PENDING: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      ASSIGNED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      PICKED_UP: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      IN_TRANSIT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    };
    return colors[status] || colors.PENDING;
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
            Operator Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and control drone operations
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Map */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Live Fleet Monitor
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Live
              </span>
            </div>
          </div>
          <div className="h-96">
            <MapComponent
              drones={drones}
              orders={orders}
              selectedDrone={selectedDrone}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* Active Missions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Active Missions
          </h3>
          <div className="space-y-4">
            {orders
              .filter((order) => ["IN_TRANSIT", "PICKED_UP"].includes(order.status))
              .map((order) => (
                <div
                  key={order.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.trackingCode || order.id}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    <div>From: {order.pickupAddress}</div>
                    <div>To: {order.deliveryAddress}</div>
                    <div>Drone: {order.drone?.name || "Unassigned"}</div>
                  </div>
                  {order.drone && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleMissionControl(order.drone.id, "pause")
                        }
                        disabled={order.status !== "IN_TRANSIT"}
                        className="flex-1 flex items-center justify-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() =>
                          handleMissionControl(order.drone.id, "abort")
                        }
                        className="flex-1 flex items-center justify-center px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                      >
                        Abort
                      </button>
                    </div>
                  )}
                </div>
              ))}
            {orders.filter((order) => ["IN_TRANSIT", "PICKED_UP"].includes(order.status)).length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p>No active missions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drone Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Drone Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {drone.name}
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
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Battery:</span>
                  <span
                    className={`font-medium ${
                      drone.battery > 60
                        ? "text-green-600"
                        : drone.battery > 30
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {drone.battery}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium">{drone.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Capacity:</span>
                  <span className="font-medium">{drone.capacity}kg</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Orders Queue */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pending Orders
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {orders.filter((o) => o.status === "PENDING").length} awaiting
            assignment
          </span>
        </div>
        <div className="space-y-4">
          {orders
            .filter((order) => order.status === "PENDING")
            .map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {order.trackingCode || order.id}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {order.customer?.name || "Unknown Customer"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {order.pickupAddress} → {order.deliveryAddress}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleAutoAssign(order.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200"
                  >
                    Auto Assign
                  </button>
                  <button className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200">
                    Manual
                  </button>
                </div>
              </div>
            ))}
          {orders.filter((order) => order.status === "PENDING").length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p>No pending orders</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
