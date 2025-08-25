# PG Management System

A comprehensive property management system for PG (Paying Guest) accommodations with full CRUD operations.

## Features

### 🔐 Authentication
- Admin login system
- Protected admin routes
- Session management

### 🏠 Room Management
- **Create**: Add new rooms with details (number, floor, type, capacity, rent, amenities)
- **Read**: View all rooms with filtering and search capabilities
- **Update**: Edit room information and status
- **Delete**: Remove rooms from the system
- Room status tracking (Available, Occupied, Maintenance)
- Wing-based organization (Wing A & B)

### 👥 Tenant Management
- **Create**: Add new tenants with complete information
- **Read**: View tenant details with search and filtering
- **Update**: Edit tenant information and status
- **Delete**: Remove tenants from the system
- Emergency contact management
- Room assignment and rent tracking

### 💰 Expense Management
- **Create**: Add new expenses with categorization
- **Read**: View expenses with analytics and filtering
- **Update**: Edit expense details
- **Delete**: Remove expenses from the system
- Category-based organization (Provisions, Bills, Maintenance, etc.)
- Payment method tracking
- Analytics and reporting

### 📊 Dashboard
- Real-time statistics
- Wing-based views
- Summary cards for quick insights

## Backend API Endpoints

### Rooms
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Tenants
- `GET /api/tenants` - Get all tenants
- `POST /api/tenants` - Create new tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Rent Payments
- `GET /api/rent-payments` - Get all rent payments
- `POST /api/rent-payments` - Create new rent payment
- `PUT /api/rent-payments/:id` - Update rent payment
- `DELETE /api/rent-payments/:id` - Delete rent payment

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pg-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the backend server**
   ```bash
   cd server
   npm start
   ```

4. **Start the frontend application**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## Usage

### Admin Login
1. Navigate to `/admin/login`
2. Use admin credentials to log in
3. Access the admin dashboard

### Adding a Room
1. Go to Rooms section
2. Click "Add Room" button
3. Fill in room details (number, floor, type, capacity, rent)
4. Select wing (A or B)
5. Add amenities
6. Save the room

### Adding a Tenant
1. Go to Tenants section
2. Click "Add Tenant" button
3. Fill in tenant information (name, email, phone)
4. Assign room number
5. Set rent and deposit amounts
6. Add emergency contact details
7. Save the tenant

### Adding an Expense
1. Go to Expenses section
2. Click "Add Expense" button
3. Select category (Provisions, Bills, Maintenance, etc.)
4. Fill in description and amount
5. Choose payment method
6. Add vendor information
7. Save the expense

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **Recharts** for data visualization

### Backend
- **Node.js** with Express
- **SQLite** database
- **RESTful API** design

### State Management
- React Context API for global state
- Local state for component-specific data

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── Layout/         # Layout components (Header, Footer)
│   └── ProtectedRoute  # Route protection component
├── context/            # React Context providers
├── models/             # TypeScript interfaces and types
├── pages/              # Page components
│   ├── admin/          # Admin pages
│   └── public/         # Public pages
├── services/           # API service layer
├── types/              # Type definitions
└── utils/              # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.



