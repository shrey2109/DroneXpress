import React, { useState } from "react";
import { Package, MapPin, Clock } from "lucide-react";
import { orderService } from "../../services/orderService";
import toast from "react-hot-toast";

const PlaceOrder = () => {
  const [orderForm, setOrderForm] = useState({
    pickupAddress: "",
    deliveryAddress: "",
    pickupLatitude: null,
    pickupLongitude: null,
    deliveryLatitude: null,
    deliveryLongitude: null,
    packageWeight: "",
    packageDescription: "",
    deliveryInstructions: "",
    urgency: "STANDARD",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = async (field, address) => {
    // Mock geocoding - in real app, use Google Maps API or similar
    const mockCoordinates = {
      lat: 40.7128 + (Math.random() - 0.5) * 0.1,
      lng: -74.006 + (Math.random() - 0.5) * 0.1,
    };

    setOrderForm((prev) => ({
      ...prev,
      [field]: address,
      [`${field.replace("Address", "Latitude")}`]: mockCoordinates.lat,
      [`${field.replace("Address", "Longitude")}`]: mockCoordinates.lng,
    }));

    // Calculate delivery estimate if both addresses are set
    if (field === "deliveryAddress" && orderForm.pickupLatitude) {
      try {
        const estimate = await orderService.calculateDeliveryEstimate(
          { lat: orderForm.pickupLatitude, lng: orderForm.pickupLongitude },
          mockCoordinates,
          orderForm.urgency
        );
        setDeliveryEstimate(estimate);
      } catch (error) {
        console.error("Failed to calculate estimate:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!orderForm.pickupLatitude || !orderForm.deliveryLatitude) {
      toast.error("Please ensure both pickup and delivery addresses are valid");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await orderService.createOrder({
        ...orderForm,
        packageWeight: parseFloat(orderForm.packageWeight),
      });

      toast.success("Order placed successfully!");

      // Reset form
      setOrderForm({
        pickupAddress: "",
        deliveryAddress: "",
        pickupLatitude: null,
        pickupLongitude: null,
        deliveryLatitude: null,
        deliveryLongitude: null,
        packageWeight: "",
        packageDescription: "",
        deliveryInstructions: "",
        urgency: "STANDARD",
      });
      setDeliveryEstimate(null);
    } catch (error) {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEstimatedTime = () => {
    const times = {
      STANDARD: "30-45 minutes",
      PRIORITY: "15-30 minutes",
      URGENT: "10-15 minutes",
    };
    return times[orderForm.urgency];
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Place New Order
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Schedule your drone delivery
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pickup Address
              </label>
              <input
                type="text"
                name="pickupAddress"
                value={orderForm.pickupAddress}
                onChange={(e) => {
                  handleInputChange(e);
                  handleAddressChange("pickupAddress", e.target.value);
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter pickup location"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Delivery Address
              </label>
              <input
                type="text"
                name="deliveryAddress"
                value={orderForm.deliveryAddress}
                onChange={(e) => {
                  handleInputChange(e);
                  handleAddressChange("deliveryAddress", e.target.value);
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter delivery location"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Package Weight (kg)
              </label>
              <input
                type="number"
                name="packageWeight"
                step="0.1"
                max="10"
                value={orderForm.packageWeight}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Max 10kg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Delivery Urgency
              </label>
              <select
                name="urgency"
                value={orderForm.urgency}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="STANDARD">
                  Standard ({getEstimatedTime()})
                </option>
                <option value="PRIORITY">
                  Priority ({getEstimatedTime()})
                </option>
                <option value="URGENT">Urgent ({getEstimatedTime()})</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Package Description
            </label>
            <input
              type="text"
              name="packageDescription"
              value={orderForm.packageDescription}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Brief description of package contents"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Delivery Instructions (Optional)
            </label>
            <textarea
              rows={3}
              name="deliveryInstructions"
              value={orderForm.deliveryInstructions}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Special delivery instructions, access codes, etc."
            />
          </div>

          {deliveryEstimate && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Delivery Estimate
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Estimated delivery time: {getEstimatedTime()}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Estimated cost: ${deliveryEstimate.fee || "12.50"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? "Placing Order..." : "Place Order"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlaceOrder;
