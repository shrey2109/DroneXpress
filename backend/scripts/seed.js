const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  await prisma.trackingEvent.deleteMany();
  await prisma.droneTelemetry.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.order.deleteMany();
  await prisma.drone.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@dronedelivery.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const operator = await prisma.user.create({
    data: {
      name: "John Operator",
      email: "operator@dronedelivery.com",
      password: hashedPassword,
      role: "OPERATOR",
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: "Alice Customer",
      email: "alice@example.com",
      password: hashedPassword,
      role: "CUSTOMER",
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Bob Smith",
      email: "bob@example.com",
      password: hashedPassword,
      role: "CUSTOMER",
    },
  });

  console.log("✅ Users created");

  // Create drones
  const drones = await Promise.all([
    prisma.drone.create({
      data: {
        name: "SkyWing Alpha",
        model: "DX-1000",
        capacity: 5.0,
        battery: 85,
        status: "AVAILABLE",
        homeLatitude: 40.7128,
        homeLongitude: -74.006,
        latitude: 40.7128,
        longitude: -74.006,
        operatorId: operator.id,
      },
    }),
    prisma.drone.create({
      data: {
        name: "AeroMax Beta",
        model: "DX-2000",
        capacity: 8.0,
        battery: 60,
        status: "DELIVERING",
        homeLatitude: 40.7128,
        homeLongitude: -74.006,
        latitude: 40.7589,
        longitude: -73.9851,
        operatorId: operator.id,
      },
    }),
    prisma.drone.create({
      data: {
        name: "CloudRider Gamma",
        model: "DX-1500",
        capacity: 3.0,
        battery: 20,
        status: "CHARGING",
        homeLatitude: 40.7128,
        homeLongitude: -74.006,
        latitude: 40.7128,
        longitude: -74.006,
        operatorId: operator.id,
      },
    }),
    prisma.drone.create({
      data: {
        name: "StormChaser Delta",
        model: "DX-3000",
        capacity: 10.0,
        battery: 95,
        status: "AVAILABLE",
        homeLatitude: 40.7128,
        homeLongitude: -74.006,
        latitude: 40.7128,
        longitude: -74.006,
        operatorId: operator.id,
      },
    }),
    prisma.drone.create({
      data: {
        name: "WindRider Echo",
        model: "DX-1200",
        capacity: 6.0,
        battery: 5,
        status: "MAINTENANCE",
        homeLatitude: 40.7128,
        homeLongitude: -74.006,
        latitude: 40.7128,
        longitude: -74.006,
        operatorId: operator.id,
      },
    }),
  ]);

  console.log("✅ Drones created");

  // Create sample orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        customerId: customer1.id,
        droneId: drones[1].id, // AeroMax Beta
        pickupAddress: "123 Main St, New York, NY",
        deliveryAddress: "456 Oak Ave, New York, NY",
        pickupLatitude: 40.7128,
        pickupLongitude: -74.006,
        deliveryLatitude: 40.7589,
        deliveryLongitude: -73.9851,
        packageWeight: 2.5,
        packageDescription: "Electronics package",
        urgency: "STANDARD",
        status: "IN_TRANSIT",
        trackingCode: "DD1692888000ABCD",
        totalDistance: 5.2,
        deliveryFee: 12.5,
        estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      },
    }),
    prisma.order.create({
      data: {
        customerId: customer2.id,
        pickupAddress: "789 Pine Rd, New York, NY",
        deliveryAddress: "321 Elm St, New York, NY",
        pickupLatitude: 40.7505,
        pickupLongitude: -73.9934,
        deliveryLatitude: 40.7614,
        deliveryLongitude: -73.9776,
        packageWeight: 1.8,
        packageDescription: "Documents",
        urgency: "PRIORITY",
        status: "PENDING",
        trackingCode: "DD1692888001EFGH",
        totalDistance: 3.1,
        deliveryFee: 15.75,
        estimatedDelivery: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes from now
      },
    }),
    prisma.order.create({
      data: {
        customerId: customer1.id,
        droneId: drones[0].id,
        pickupAddress: "555 Broadway, New York, NY",
        deliveryAddress: "777 5th Ave, New York, NY",
        pickupLatitude: 40.7282,
        pickupLongitude: -74.0776,
        deliveryLatitude: 40.7614,
        deliveryLongitude: -73.9776,
        packageWeight: 0.8,
        packageDescription: "Medical supplies",
        urgency: "URGENT",
        status: "DELIVERED",
        trackingCode: "DD1692880000IJKL",
        totalDistance: 8.3,
        deliveryFee: 22.4,
        estimatedDelivery: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        actualDelivery: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      },
    }),
  ]);

  console.log("✅ Orders created");

  // Create tracking events
  await Promise.all([
    prisma.trackingEvent.create({
      data: {
        orderId: orders[0].id,
        event: "ASSIGNED",
        description: "Order assigned to AeroMax Beta",
        location: "AeroMax Beta",
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
      },
    }),
    prisma.trackingEvent.create({
      data: {
        orderId: orders[0].id,
        event: "PICKED_UP",
        description: "Package picked up from 123 Main St",
        location: "AeroMax Beta",
        latitude: 40.7128,
        longitude: -74.006,
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
      },
    }),
    prisma.trackingEvent.create({
      data: {
        orderId: orders[2].id,
        event: "DELIVERED",
        description: "Package delivered successfully",
        location: "SkyWing Alpha",
        latitude: 40.7614,
        longitude: -73.9776,
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
      },
    }),
  ]);

  console.log("✅ Tracking events created");

  // Create sample telemetry data
  const telemetryPromises = [];
  for (const drone of drones) {
    for (let i = 0; i < 10; i++) {
      telemetryPromises.push(
        prisma.droneTelemetry.create({
          data: {
            droneId: drone.id,
            latitude: drone.latitude + (Math.random() - 0.5) * 0.01,
            longitude: drone.longitude + (Math.random() - 0.5) * 0.01,
            altitude: 50 + Math.random() * 50,
            battery: Math.max(0, drone.battery - Math.random() * 20),
            speed: Math.random() * 30,
            temperature: 20 + Math.random() * 15,
            humidity: 40 + Math.random() * 30,
            timestamp: new Date(Date.now() - i * 5 * 60 * 1000), // Every 5 minutes
          },
        })
      );
    }
  }
  await Promise.all(telemetryPromises);

  console.log("✅ Telemetry data created");

  console.log("🎉 Database seeded successfully!");
  console.log("\nLogin credentials:");
  console.log("Admin: admin@dronedelivery.com / password123");
  console.log("Operator: operator@dronedelivery.com / password123");
  console.log("Customer: alice@example.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
