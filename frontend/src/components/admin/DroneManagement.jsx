import {
  AlertTriangle,
  Battery,
  CheckCircle,
  Edit,
  Eye,
  Plus,
  Trash2,
  Truck,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { droneService } from "../../services/droneService";
import toast from "react-hot-toast";

const DroneManagement = ({ darkMode }) => {
  const [drones, setDrones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDrone, setEditingDrone] = useState(null);

  useEffect(() => {
    loadDrones();
  }, []);

  const loadDrones = async () => {
    setIsLoading(true);
    try {
      const response = await droneService.getDrones();
      setDrones(response.drones || []);
    } catch (error) {
      console.error("Failed to load drones:", error);
      toast.error("Failed to load drones");
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors = {
    AVAILABLE:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    DELIVERING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    CHARGING:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    MAINTENANCE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    OFFLINE: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Drone Fleet Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and monitor your drone fleet
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Drone</span>
        </button>
      </div>

      {/* Fleet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Available
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {drones.filter((d) => d.status === "AVAILABLE").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Delivering
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {drones.filter((d) => d.status === "DELIVERING").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Charging
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {drones.filter((d) => d.status === "CHARGING").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Maintenance
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {drones.filter((d) => d.status === "Maintenance").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Drone List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Fleet Status
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Drone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Battery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Current Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {drones.map((drone) => (
                <tr
                  key={drone.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {drone.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {drone.id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[drone.status]
                      }`}
                    >
                      {drone.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Battery
                        className={`w-4 h-4 mr-2 ${getBatteryColor(
                          drone.battery
                        )}`}
                      />
                      <span
                        className={`text-sm font-medium ${getBatteryColor(
                          drone.battery
                        )}`}
                      >
                        {drone.battery}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {drone.capacity} kg
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {drone.orders && drone.orders.length > 0 
                        ? drone.orders[0].trackingCode || drone.orders[0].id
                        : "None"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingDrone(drone)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DroneManagement;
