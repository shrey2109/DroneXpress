import React, { createContext, useContext, useEffect, useRef } from "react";
import socketService from "../services/socketService";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect socket when user is authenticated
      socketRef.current = socketService.connect();

      // Join role-based room for targeted updates
      if (user.role) {
        socketService.joinRoom(user.role.toLowerCase());
      }

      // Join user-specific room
      socketService.joinRoom(`user_${user.id}`);
    } else {
      // Disconnect socket when user logs out
      socketService.disconnect();
      socketRef.current = null;
    }

    return () => {
      if (socketRef.current) {
        socketService.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  const value = {
    socket: socketRef.current,
    isConnected: socketService.isConnected,

    // Event subscription methods
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
    send: socketService.send.bind(socketService),

    // Subscription methods
    subscribeToDrone: socketService.subscribeToDrone.bind(socketService),
    unsubscribeFromDrone:
      socketService.unsubscribeFromDrone.bind(socketService),
    subscribeToOrder: socketService.subscribeToOrder.bind(socketService),
    unsubscribeFromOrder:
      socketService.unsubscribeFromOrder.bind(socketService),
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
