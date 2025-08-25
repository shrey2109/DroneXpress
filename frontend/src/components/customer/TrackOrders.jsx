import React, { useState, useEffect } from "react";
import { Search, MapPin, Clock, Package, Eye } from "lucide-react";
import { orderService } from "../../services/orderService";
import { useSocket } from "../../context/SocketContext";
import MapComponent from "../dashboard/MapComponent";
import toast from "react-hot-toast";

const TrackOrders = () => {
  const [trackingId, setTrackingId] = useState("");
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { on, off, subscribeToOrder, unsubscribeFromOrder } = useSocket();

  useEffect(() => {
    loadRecentOrders();
  }, []);

  useEffect(() => {
    // Subscribe to order updates
    const handleOrderUpdate = (data) => {
      if (trackedOrder && data.orderId === trackedOrder.id) {
        setTrackedOrder((prev) => ({ ...prev, ...data }));
        toast.success(`Order status updated: ${data.status}`);
      }

      // Update recent orders list
      setRecentOrders((prev) =>
        prev.map((order) =>
          order.id === data.orderId ? { ...order, ...data } : order
        )
      );
    };

    on("orderStatusUpdate", handleOrderUpdate);

    return () => {
      off("orderStatusUpdate", handleOrderUpdate);
    };
  }, [on, off, trackedOrder]);

  const loadRecentOrders = async () => {
    try {
      const response = await orderService.getCustomerOrders({ limit: 5 });
      setRecentOrders(response.orders || []);
    } catch (error) {
      console.error("Failed to load recent orders:", error);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setIsLoading(true);
    try {
      const order = await orderService.trackOrder(trackingId);
      setTrackedOrder(order);

      // Subscribe to real-time updates for this order
      if (order) {
        subscribeToOrder(order.id);
      }
    } catch (error) {
      toast.error("Order not found. Please check your tracking ID.");
      setTrackedOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const order = await orderService.getOrder(orderId);
      setTrackedOrder(order);
      subscribeToOrder(order.id);
      setTrackingId(order.trackingCode || order.id);
    } catch (error) {
      toast.error("Failed to load order details.");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      ASSIGNED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      PICKED_UP:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      IN_TRANSIT:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      DELIVERED:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      colors[status] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    );
  };

  return (
    <div className="space-y-6">
      {/* Track Order Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Track Your Order
        </h2>

        <form onSubmit={handleTrack} className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter tracking ID (e.g., DD1692876543AXBZ)"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            {isLoading ? "Tracking..." : "Track"}
          </button>
        </form>

        {/* Tracked Order Details */}
        {trackedOrder && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Order {trackedOrder.trackingCode || trackedOrder.id}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  trackedOrder.status
                )}`}
              >
                {trackedOrder.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Order Details
                </h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                    <div>
                      <span className="font-medium">From:</span>{" "}
                      {trackedOrder.pickupAddress}
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 text-red-500" />
                    <div>
                      <span className="font-medium">To:</span>{" "}
                      {trackedOrder.deliveryAddress}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Package:</span>{" "}
                    {trackedOrder.packageDescription}
                  </div>
                  <div>
                    <span className="font-medium">Weight:</span>{" "}
                    {trackedOrder.packageWeight}kg
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(trackedOrder.createdAt).toLocaleString()}
                  </div>
                  {trackedOrder.drone && (
                    <div>
                      <span className="font-medium">Assigned Drone:</span>{" "}
                      {trackedOrder.drone.name}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Live Tracking
                </h4>
                <div className="h-48 rounded-lg overflow-hidden">
                  <MapComponent
                    drones={trackedOrder.drone ? [trackedOrder.drone] : []}
                    orders={trackedOrder ? [trackedOrder] : []}
                    selectedDrone={trackedOrder.drone}
                    darkMode={false}
                  />
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            {trackedOrder.trackingEvents &&
              trackedOrder.trackingEvents.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Delivery Timeline
                  </h4>
                  <div className="space-y-3">
                    {trackedOrder.trackingEvents.map((event, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {event.event}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {trackedOrder.status === "IN_TRANSIT" &&
              trackedOrder.estimatedDelivery && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <span className="text-blue-900 dark:text-blue-100">
                      Estimated arrival:{" "}
                      {new Date(
                        trackedOrder.estimatedDelivery
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Your Recent Orders
        </h3>
        <div className="space-y-4">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {order.trackingCode || order.id}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {order.pickupAddress} → {order.deliveryAddress}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
                <button
                  onClick={() => handleViewOrder(order.id)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {recentOrders.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <Package className="w-8 h-8 mx-auto mb-2" />
              <p>No recent orders found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrders;
