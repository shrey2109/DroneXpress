import React, { useState, useContext } from "react";
import {
  Package,
  BarChart3,
  MapPin,
  User,
  Settings,
  Plus,
  Menu,
  X,
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { AuthContext } from "../auth/AuthProvider";

const DashboardLayout = ({
  children,
  currentView,
  setCurrentView,
  darkMode,
  setDarkMode,
}) => {
  const { user, logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = {
    Admin: [
      { name: "Analytics", icon: BarChart3, id: "analytics" },
      { name: "Drone Management", icon: Settings, id: "drones" },
      { name: "Orders", icon: Package, id: "orders" },
      { name: "Operators", icon: User, id: "operators" },
    ],
    Operator: [
      { name: "Dashboard", icon: BarChart3, id: "operator-dashboard" },
      { name: "Fleet Monitor", icon: MapPin, id: "fleet" },
      { name: "Orders", icon: Package, id: "orders" },
      { name: "Mission Control", icon: Settings, id: "missions" },
    ],
    Customer: [
      { name: "Place Order", icon: Plus, id: "place-order" },
      { name: "Track Orders", icon: MapPin, id: "track-orders" },
      { name: "Order History", icon: Package, id: "order-history" },
    ],
  };

  const userNavigation = navigation[user?.role] || [];

  return (
    <div
      className={`${
        darkMode ? "dark" : ""
      } min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}
    >
      {/* Sidebar + Topbar omitted here for brevity (use same code from your file) */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 items-center bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden ml-4 text-gray-500 hover:text-gray-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-1 justify-between items-center px-4 lg:px-6">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user?.role} Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
