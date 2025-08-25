import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom drone icon
const createDroneIcon = (status, battery) => {
  const getColor = () => {
    if (battery < 20) return "#ef4444"; // red
    if (battery < 50) return "#f59e0b"; // yellow
    return "#10b981"; // green
  };

  const getStatusColor = () => {
    switch (status) {
      case "AVAILABLE": return "#10b981";
      case "DELIVERING": return "#3b82f6";
      case "CHARGING": return "#f59e0b";
      case "MAINTENANCE": return "#ef4444";
      case "OFFLINE": return "#6b7280";
      default: return "#10b981";
    }
  };

  return L.divIcon({
    className: "custom-drone-icon",
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${getStatusColor()};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: ${getColor()};
          border-radius: 50%;
        "></div>
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 2px 4px;
          border-radius: 2px;
          font-size: 10px;
          white-space: nowrap;
        ">${battery}%</div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Custom order pickup/delivery icons
const createOrderIcon = (type) => {
  const color = type === "pickup" ? "#3b82f6" : "#10b981";
  const symbol = type === "pickup" ? "P" : "D";
  
  return L.divIcon({
    className: "custom-order-icon",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">${symbol}</div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const MapComponent = ({ drones, orders, selectedDrone, darkMode }) => {
  const mapRef = useRef(null);
  const [center, setCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const [zoom, setZoom] = useState(12);

  // Generate mock coordinates for drones if they don't have real ones
  const getDroneCoordinates = (drone, index) => {
    if (drone.latitude && drone.longitude) {
      return [drone.latitude, drone.longitude];
    }
    // Generate mock coordinates around NYC
    const baseLat = 40.7128;
    const baseLng = -74.0060;
    const latOffset = (Math.sin(index * 0.5) * 0.02);
    const lngOffset = (Math.cos(index * 0.5) * 0.02);
    return [baseLat + latOffset, baseLng + lngOffset];
  };

  // Generate mock coordinates for orders
  const getOrderCoordinates = (order, type) => {
    if (type === "pickup" && order.pickupLatitude && order.pickupLongitude) {
      return [order.pickupLatitude, order.pickupLongitude];
    }
    if (type === "delivery" && order.deliveryLatitude && order.deliveryLongitude) {
      return [order.deliveryLatitude, order.deliveryLongitude];
    }
    
    // Generate mock coordinates
    const baseLat = 40.7128;
    const baseLng = -74.0060;
    const latOffset = (Math.random() - 0.5) * 0.04;
    const lngOffset = (Math.random() - 0.5) * 0.04;
    return [baseLat + latOffset, baseLng + lngOffset];
  };

  // Calculate center based on drones and orders
  useEffect(() => {
    if (drones.length > 0 || orders.length > 0) {
      const allPoints = [];
      
      // Add drone positions
      drones.forEach((drone, index) => {
        allPoints.push(getDroneCoordinates(drone, index));
      });
      
      // Add order positions
      orders.forEach((order) => {
        allPoints.push(getOrderCoordinates(order, "pickup"));
        allPoints.push(getOrderCoordinates(order, "delivery"));
      });
      
      if (allPoints.length > 0) {
        const avgLat = allPoints.reduce((sum, point) => sum + point[0], 0) / allPoints.length;
        const avgLng = allPoints.reduce((sum, point) => sum + point[1], 0) / allPoints.length;
        setCenter([avgLat, avgLng]);
      }
    }
  }, [drones, orders]);

  const getStatusText = (status) => {
    switch (status) {
      case "AVAILABLE": return "Available";
      case "DELIVERING": return "Delivering";
      case "CHARGING": return "Charging";
      case "MAINTENANCE": return "Maintenance";
      case "OFFLINE": return "Offline";
      default: return status;
    }
  };

  const getBatteryColor = (battery) => {
    if (battery < 20) return "text-red-500";
    if (battery < 50) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        className="z-0"
      >
        <TileLayer
          url={darkMode 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Drone Markers */}
        {drones.map((drone, index) => {
          const coordinates = getDroneCoordinates(drone, index);
          const isSelected = selectedDrone && selectedDrone.id === drone.id;
          
          return (
            <div key={`drone-${drone.id}`}>
              <Marker
                position={coordinates}
                icon={createDroneIcon(drone.status, drone.battery)}
                eventHandlers={{
                  click: () => {
                    // Handle drone selection
                    console.log("Selected drone:", drone);
                  },
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{drone.name}</h3>
                    <p className="text-sm text-gray-600">
                      Status: <span className="font-medium">{getStatusText(drone.status)}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Battery: <span className={`font-medium ${getBatteryColor(drone.battery)}`}>
                        {drone.battery}%
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Capacity: {drone.capacity}kg
                    </p>
                    {drone.currentLocation && (
                      <p className="text-sm text-gray-600">
                        Location: {drone.currentLocation}
                      </p>
                    )}
                    {drone.currentOrder && (
                      <p className="text-sm text-blue-600 font-medium">
                        Order: {drone.currentOrder}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
              
              {/* Selection circle for selected drone */}
              {isSelected && (
                <Circle
                  center={coordinates}
                  radius={100}
                  pathOptions={{
                    color: "#3b82f6",
                    fillColor: "#3b82f6",
                    fillOpacity: 0.1,
                    weight: 2,
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Order Markers */}
        {orders.map((order) => {
          const pickupCoords = getOrderCoordinates(order, "pickup");
          const deliveryCoords = getOrderCoordinates(order, "delivery");
          
          return (
            <div key={`order-${order.id}`}>
              {/* Pickup Marker */}
              <Marker
                position={pickupCoords}
                icon={createOrderIcon("pickup")}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">Pickup</h3>
                    <p className="text-sm text-gray-600">
                      Order: {order.trackingCode || order.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      Address: {order.pickupAddress}
                    </p>
                    <p className="text-sm text-gray-600">
                      Weight: {order.packageWeight}kg
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Delivery Marker */}
              <Marker
                position={deliveryCoords}
                icon={createOrderIcon("delivery")}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">Delivery</h3>
                    <p className="text-sm text-gray-600">
                      Order: {order.trackingCode || order.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      Address: {order.deliveryAddress}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: {order.status}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Route Line */}
              <Polyline
                positions={[pickupCoords, deliveryCoords]}
                pathOptions={{
                  color: "#3b82f6",
                  weight: 3,
                  opacity: 0.7,
                  dashArray: "5, 5",
                }}
              />
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
