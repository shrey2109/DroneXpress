import {
  BarChart,
  CheckCircle,
  Clock,
  Download,
  LineChart,
  Package,
  PieChart,
  Truck,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AdminAnalytics = ({ darkMode }) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Deliveries
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                331
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                +12% from last week
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
                4/5
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                1 in maintenance
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
                18 min
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                -3 min improved
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
                94.2%
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                +2.1% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daily Deliveries
            </h3>
            <button className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockAnalytics.dailyDeliveries}>
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
                  dataKey="onTime"
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
              <BarChart data={mockAnalytics.droneUtilization}>
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
                  dataKey="utilization"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fleet Status and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Fleet Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockAnalytics.statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {mockAnalytics.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Order ORD003 delivered successfully
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  2 minutes ago
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Drone D002 assigned to Order ORD001
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  15 minutes ago
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Drone D003 started charging
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  32 minutes ago
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Drone D005 requires maintenance
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  1 hour ago
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
