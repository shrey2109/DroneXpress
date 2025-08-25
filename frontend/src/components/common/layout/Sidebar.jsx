import React from "react";
import { NavLink } from "react-router-dom";
import {
  Package,
  BarChart3,
  Settings,
  MapPin,
  User,
  Plus,
  Truck,
  X,
} from "lucide-react";

const Sidebar = ({ userRole, isOpen, onClose }) => {
  const navigation = {
    ADMIN: [
      { name: "Analytics", icon: BarChart3, path: "/admin/analytics" },
      { name: "Drone Management", icon: Settings, path: "/admin/drones" },
      { name: "User Management", icon: User, path: "/admin/users" },
    ],
    OPERATOR: [
      { name: "Dashboard", icon: BarChart3, path: "/operator/dashboard" },
      { name: "Fleet Monitor", icon: MapPin, path: "/operator/fleet" },
      { name: "Mission Control", icon: Settings, path: "/operator/missions" },
    ],
    CUSTOMER: [
      { name: "Place Order", icon: Plus, path: "/customer/place-order" },
      { name: "Track Orders", icon: MapPin, path: "/customer/track-orders" },
      { name: "Order History", icon: Package, path: "/customer/order-history" },
    ],
  };

  const userNavigation = navigation[userRole] || [];

  const sidebarClasses = isOpen
    ? "fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800 shadow-xl z-50"
    : "flex flex-col flex-grow bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700";

  return (
    <div className={sidebarClasses}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Package className="w-8 h-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
            DroneXpress
          </span>
        </div>
        {isOpen && onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {userNavigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer - Role indicator */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {userRole?.charAt(0)}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {userRole} Dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
