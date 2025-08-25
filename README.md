# Drone Delivery Management System

A comprehensive drone delivery management system with real-time monitoring, mission control, and user management capabilities.

## Features

### 🚁 **Drone Fleet Management**
- Real-time drone status monitoring
- Fleet overview with statistics
- Drone assignment and control
- Battery and location tracking
- Maintenance scheduling

### 📦 **Order Management**
- Order creation and tracking
- Real-time delivery status updates
- Route optimization
- Delivery estimates
- Order history and analytics

### 👥 **User Management**
- Multi-role system (Admin, Operator, Customer)
- User authentication and authorization
- Profile management
- Role-based access control

### 🎯 **Mission Control**
- Real-time mission monitoring
- Mission pause/resume/abort controls
- Auto-assignment of orders to drones
- Manual mission control options

### 📊 **Analytics & Reporting**
- Fleet performance metrics
- Delivery success rates
- Revenue analytics
- Operational insights

## Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Router** for navigation
- **React Hot Toast** for notifications
- **Socket.IO Client** for real-time updates

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **Prisma** ORM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **bcrypt** for password hashing

## Project Structure

```
DroneAppCursor/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── admin/        # Admin-specific components
│   │   │   ├── customer/     # Customer-specific components
│   │   │   ├── operator/     # Operator-specific components
│   │   │   ├── auth/         # Authentication components
│   │   │   ├── common/       # Shared components
│   │   │   └── dashboard/    # Dashboard components
│   │   ├── context/          # React context providers
│   │   ├── services/         # API service functions
│   │   └── utils/            # Utility functions
│   └── package.json
├── backend/                  # Node.js backend application
│   ├── routes/               # API route handlers
│   ├── services/             # Business logic services
│   ├── middleware/           # Express middleware
│   ├── prisma/               # Database schema and migrations
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DroneAppCursor
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your database credentials
   
   # Run database migrations
   npx prisma migrate dev
   
   # Start the backend server
   npm start
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   
   # Start the frontend development server
   npm start
   ```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dronedelivery"

# JWT Secret
JWT_SECRET="your-secret-key"

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:3000"
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Drones
- `GET /api/drones` - Get all drones
- `GET /api/drones/fleet-status` - Get fleet status
- `GET /api/drones/available` - Get available drones
- `POST /api/drones` - Create new drone
- `PUT /api/drones/:id` - Update drone
- `DELETE /api/drones/:id` - Delete drone

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status

### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/fleet-status` - Fleet status analytics
- `GET /api/analytics/export/:type` - Export reports

## User Roles

### 👨‍💼 **Admin**
- Full system access
- User management
- Fleet management
- Analytics and reporting
- System configuration

### 👨‍✈️ **Operator**
- Mission control
- Fleet monitoring
- Order assignment
- Real-time drone control
- Delivery management

### 👤 **Customer**
- Order placement
- Order tracking
- Order history
- Profile management

## Real-time Features

The application uses Socket.IO for real-time updates:

- **Drone Location Updates** - Real-time drone position tracking
- **Order Status Updates** - Live order status changes
- **Mission Control** - Real-time mission management
- **Fleet Monitoring** - Live fleet status updates

## Database Schema

### Core Entities
- **Users** - User accounts with roles
- **Drones** - Drone fleet information
- **Orders** - Delivery orders
- **Missions** - Active delivery missions
- **DroneTelemetry** - Real-time drone data
- **TrackingEvents** - Order tracking events

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
