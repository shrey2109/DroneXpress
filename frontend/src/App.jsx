import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context Providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";

// Components
import PrivateRoute from "./components/auth/PrivateRoute";
import RoleGuard from "./components/auth/RoleGuard";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import DashboardLayout from "./components/common/layout/DashboardLayout";

// Views
import AdminAnalytics from "./components/admin/Analytics";
import DroneManagement from "./components/admin/DroneManagement";
import UserManagement from "./components/admin/UserManagement";
import OperatorDashboard from "./components/operator/OperatorDashboard";
import FleetMonitor from "./components/operator/FleetMonitor";
import MissionControl from "./components/operator/MissionControl";
import PlaceOrder from "./components/customer/PlaceOrder";
import TrackOrders from "./components/customer/TrackOrders";
import OrderHistory from "./components/customer/OrderHistory";

// Styles
import "./styles/globals.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <DashboardLayout />
                    </PrivateRoute>
                  }
                >
                  {/* Admin Routes */}
                  <Route
                    path="admin/analytics"
                    element={
                      <RoleGuard allowedRoles={["ADMIN"]}>
                        <AdminAnalytics />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="admin/drones"
                    element={
                      <RoleGuard allowedRoles={["ADMIN"]}>
                        <DroneManagement />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="admin/users"
                    element={
                      <RoleGuard allowedRoles={["ADMIN"]}>
                        <UserManagement />
                      </RoleGuard>
                    }
                  />

                  {/* Operator Routes */}
                  <Route
                    path="operator/dashboard"
                    element={
                      <RoleGuard allowedRoles={["ADMIN", "OPERATOR"]}>
                        <OperatorDashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="operator/fleet"
                    element={
                      <RoleGuard allowedRoles={["ADMIN", "OPERATOR"]}>
                        <FleetMonitor />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="operator/missions"
                    element={
                      <RoleGuard allowedRoles={["ADMIN", "OPERATOR"]}>
                        <MissionControl />
                      </RoleGuard>
                    }
                  />

                  {/* Customer Routes */}
                  <Route
                    path="customer/place-order"
                    element={
                      <RoleGuard allowedRoles={["CUSTOMER"]}>
                        <PlaceOrder />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="customer/track-orders"
                    element={
                      <RoleGuard allowedRoles={["CUSTOMER"]}>
                        <TrackOrders />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="customer/order-history"
                    element={
                      <RoleGuard allowedRoles={["CUSTOMER"]}>
                        <OrderHistory />
                      </RoleGuard>
                    }
                  />

                  {/* Default redirects based on role */}
                  <Route
                    index
                    element={
                      <PrivateRoute>
                        <RoleBasedRedirect />
                      </PrivateRoute>
                    }
                  />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>

              {/* Toast notifications */}
              <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerStyle={{}}
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                  },
                  success: {
                    duration: 3000,
                    theme: {
                      primary: "green",
                      secondary: "black",
                    },
                  },
                }}
              />
            </div>
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

// Component for role-based redirects
const RoleBasedRedirect = () => {
  const { user } = useAuth();

  React.useEffect(() => {
    if (user?.role === "ADMIN") {
      window.location.replace("/admin/analytics");
    } else if (user?.role === "OPERATOR") {
      window.location.replace("/operator/dashboard");
    } else if (user?.role === "CUSTOMER") {
      window.location.replace("/customer/place-order");
    }
  }, [user]);

  return <div>Redirecting...</div>;
};

// 404 Component
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        404
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Page not found</p>
      <a
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Go Home
      </a>
    </div>
  </div>
);

export default App;
