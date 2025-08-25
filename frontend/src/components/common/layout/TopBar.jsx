import React from "react";
import { Menu, Bell, Sun, Moon } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";

const TopBar = ({ onMenuClick, user }) => {
  const { logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden ml-4 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex flex-1 justify-between items-center px-4 lg:px-6">
        {/* Page title */}
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user?.role} Dashboard
          </h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
              <Bell className="w-5 h-5" />
            </button>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
