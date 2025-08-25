import React from "react";
import { useAuth } from "../../context/AuthContext";

const RoleGuard = ({ children, allowedRoles, fallback = null }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You need to be logged in to access this page.
            </p>
          </div>
        </div>
      )
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Required roles: {allowedRoles.join(", ")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Your role: {user.role}
            </p>
          </div>
        </div>
      )
    );
  }

  return children;
};

export default RoleGuard;
