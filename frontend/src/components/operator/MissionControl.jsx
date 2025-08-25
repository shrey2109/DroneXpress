import React, { useState, useEffect } from "react";
import { Play, Pause, Square, MapPin, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { orderService } from "../../services/orderService";
import { droneService } from "../../services/droneService";
import { useSocket } from "../../context/SocketContext";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";

const MissionControl = () => {
  const [activeMissions, setActiveMissions] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [missionControl, setMissionControl] = useState({});
  const { darkMode } = useTheme();
  const { on, off } = useSocket();

  useEffect(() => {
    loadMissionData();
    setupSocketListeners();

    return () => {
      cleanupSocketListeners();
    };
  }, []);

  const setupSocketListeners = () => {
    const handleMissionUpdate = (data) => {
      setActiveMissions(prev => 
        prev.map(mission => 
          mission.id === data.missionId 
            ? { ...mission, ...data.updates }
            : mission
        )
      );
    };

    const handleOrderUpdate = (data) => {
      if (data.status === "IN_TRANSIT" || data.status === "PICKED_UP") {
        // Add to active missions if not already there
        setActiveMissions(prev => {
          const exists = prev.find(m => m.orderId === data.orderId);
          if (!exists) {
            return [...prev, { ...data, id: data.orderId }];
          }
          return prev.map(m => m.orderId === data.orderId ? { ...m, ...data } : m);
        });
      } else if (data.status === "DELIVERED" || data.status === "CANCELLED") {
        // Remove from active missions
        setActiveMissions(prev => prev.filter(m => m.orderId !== data.orderId));
      }
    };

    const handleNewOrder = (data) => {
      setPendingOrders(prev => [data, ...prev]);
    };

    on("missionUpdate", handleMissionUpdate);
    on("orderStatusUpdate", handleOrderUpdate);
    on("newOrder", handleNewOrder);

    return () => {
      off("missionUpdate", handleMissionUpdate);
      off("orderStatusUpdate", handleOrderUpdate);
      off("newOrder", handleNewOrder);
    };
  };

  const cleanupSocketListeners = () => {
    off("missionUpdate");
    off("orderStatusUpdate");
    off("newOrder");
  };

  const loadMissionData = async () => {
    setIsLoading(true);
    try {
      const [ordersResponse, missionsResponse] = await Promise.all([
        orderService.getOrders({ status: "IN_TRANSIT,PICKED_UP" }),
        orderService.getOrders({ status: "PENDING" })
      ]);

      setActiveMissions(ordersResponse.orders || []);
      setPendingOrders(missionsResponse.orders || []);
    } catch (error) {
      console.error("Failed to load mission data:", error);
      toast.error("Failed to load mission data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMissionControl = async (missionId, action) => {
    try {
      const mission = activeMissions.find(m => m.id === missionId);
      if (!mission) return;

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

      await orderService.updateOrderStatus(mission.orderId, newStatus);
      
      setMissionControl(prev => ({
        ...prev,
        [missionId]: {
          ...prev[missionId],
          status: newStatus,
          canPause: action === "resume",
          canResume: action === "pause",
          canAbort: action !== "abort",
        },
      }));

      toast.success(`Mission ${action}ed successfully`);
    } catch (error) {
      console.error("Failed to control mission:", error);
      toast.error("Failed to control mission");
    }
  };

  const handleAutoAssign = async (orderId) => {
    try {
      const order = pendingOrders.find(o => o.id === orderId);
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

      // Remove from pending orders
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      
      toast.success(`Order assigned to ${selectedDrone.name}`);
    } catch (error) {
      console.error("Failed to auto-assign order:", error);
      toast.error("Failed to auto-assign order");
    }
  };

  const handleManualAssign = async (orderId, droneId) => {
    try {
      await orderService.updateOrderStatus(orderId, "ASSIGNED", `Manually assigned to drone ${droneId}`);
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success("Order manually assigned");
    } catch (error) {
      console.error("Failed to manually assign order:", error);
      toast.error("Failed to manually assign order");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      IN_TRANSIT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      PICKED_UP: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      PAUSED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      PENDING: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
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
            Mission Control
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage active missions and control drone operations
          </p>
        </div>
        <button
          onClick={loadMissionData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Missions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Active Missions ({activeMissions.length})
          </h3>
          <div className="space-y-4">
            {activeMissions.map((mission) => (
              <div
                key={mission.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedMission === mission.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {mission.trackingCode || mission.id}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Drone: {mission.drone?.name || "Unassigned"}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      mission.status
                    )}`}
                  >
                    {mission.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{mission.pickupAddress}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{mission.deliveryAddress}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>ETA: {mission.estimatedDelivery || "Calculating..."}</span>
                  </div>
                  <div className="flex items-center">
                    <span>Weight: {mission.packageWeight}kg</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleMissionControl(mission.id, "pause")}
                    disabled={mission.status !== "IN_TRANSIT"}
                    className="flex-1 flex items-center justify-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Pause className="w-3 h-3 mr-1" />
                    Pause
                  </button>
                  <button
                    onClick={() => handleMissionControl(mission.id, "resume")}
                    disabled={mission.status !== "PAUSED"}
                    className="flex-1 flex items-center justify-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Resume
                  </button>
                  <button
                    onClick={() => handleMissionControl(mission.id, "abort")}
                    disabled={mission.status === "CANCELLED"}
                    className="flex-1 flex items-center justify-center px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Square className="w-3 h-3 mr-1" />
                    Abort
                  </button>
                </div>
              </div>
            ))}
            {activeMissions.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p>No active missions</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Pending Orders ({pendingOrders.length})
          </h3>
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.trackingCode || order.id}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {order.customer?.name || "Unknown Customer"}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center mb-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{order.pickupAddress} → {order.deliveryAddress}</span>
                  </div>
                  <div className="flex items-center">
                    <span>Weight: {order.packageWeight}kg | Urgency: {order.urgency}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAutoAssign(order.id)}
                    className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors duration-200"
                  >
                    Auto Assign
                  </button>
                  <button
                    onClick={() => handleManualAssign(order.id, "MANUAL")}
                    className="flex-1 px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                  >
                    Manual
                  </button>
                </div>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p>No pending orders</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mission Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Mission Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Active Missions
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {activeMissions.length}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Pending Orders
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {pendingOrders.length}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  In Transit
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {activeMissions.filter(m => m.status === "IN_TRANSIT").length}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Picked Up
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {activeMissions.filter(m => m.status === "PICKED_UP").length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionControl;
