import React, { useState, useEffect } from "react";
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  Download,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { analyticsService } from "../../services/analyticsService";
import { useSocket } from "../../context/SocketContext";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";

const AdminAnalytics = () => {
  const [kpis, setKpis] = useState(null);
  const [dailyDeliveries, setDailyDeliveries] = useState([]);
  const [droneUtilization, setDroneUtilization] = useState([]);
  const [fleetStatus, setFleetStatus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { darkMode } = useTheme();
  const { on, off } = useSocket();

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  useEffect(() => {
    // Subscribe to real-time updates
    const handleFleetUpdate = (data) => {
      setFleetStatus(data);
    };

    const handleDeliveryUpdate = (data) => {
      // Refresh KPIs when new deliveries happen
      loadKPIs();
    };

    on("fleetStatusUpdate", handleFleetUpdate);
    on("orderStatusUpdate", handleDeliveryUpdate);

    return () => {
      off("fleetStatusUpdate", handleFleetUpdate);
      off("orderStatusUpdate", handleDeliveryUpdate);
    };
  }, [on, off]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const [kpisData, dailyData, utilizationData, statusData] =
        await Promise.all([
          analyticsService.getDashboardKPIs(),
          analyticsService.getDailyDeliveries(7),
          analyticsService.getDroneUtilization(),
          analyticsService.getFleetStatus(),
        ]);

      setKpis(kpisData);
      setDailyDeliveries(dailyData);
      setDroneUtilization(utilizationData);
      setFleetStatus(statusData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadKPIs = async () => {
    try {
      const kpisData = await analyticsService.getDashboardKPIs();
      setKpis(kpisData);
    } catch (error) {
      console.error("Failed to refresh KPIs:", error);
    }
  };

  const handleExport = async (type) => {
    try {
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      await analyticsService.exportData(type, startDate, endDate, "csv");
      toast.success(`${type} data exported successfully`);
    } catch (error) {
      toast.error("Export failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statusColors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Deliveries
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {kpis.totalDeliveries}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  +{Math.round(kpis.deliveryGrowth)}% from yesterday
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Drones
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {kpis.activeDrones}/{kpis.totalDrones}
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {kpis.totalDrones - kpis.activeDrones} offline
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Delivery Time
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {kpis.avgDeliveryTime} min
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Improved performance
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  On-Time Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {kpis.onTimeRate}%
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Excellent performance
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daily Deliveries
            </h3>
            <button
              onClick={() => handleExport("deliveries")}
              className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyDeliveries}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#374151" : "#E5E7EB"}
                />
                <XAxis
                  dataKey="date"
                  stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                  fontSize={12}
                  tickFormatter={(value) =>
                    new Date(value).getDate().toString()
                  }
                />
                <YAxis
                  stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                    border: darkMode
                      ? "1px solid #374151"
                      : "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="on_time"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="On Time"
                />
                <Line
                  type="monotone"
                  dataKey="delayed"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Delayed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Drone Utilization
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={droneUtilization}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#374151" : "#E5E7EB"}
                />
                <XAxis
                  dataKey="name"
                  stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                    border: darkMode
                      ? "1px solid #374151"
                      : "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="total_missions"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fleet Status */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Fleet Status Distribution
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={fleetStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {fleetStatus.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={statusColors[index % statusColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
