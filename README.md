# TableTime - Restaurant Queue Management System

TableTime is an AI-powered restaurant queue management system that enables customers to join virtual queues, receive accurate wait time predictions, and get notified when their table is ready. The system provides staff with efficient queue management tools and managers with comprehensive analytics.

## Features

### Customer Features
- **Virtual Queue** - Join the queue remotely without waiting in the lobby
- **AI Wait Time Predictions** - Get accurate wait time estimates based on real-time data
- **QR Code Tickets** - Receive unique QR codes for secure validation
- **Real-time Updates** - Track your position in the queue
- **Notification System** - Get notified when your table is ready
- **Reservation History** - View past reservations

### Staff Features
- **Queue Management** - View and manage active queue in real-time
- **Customer Notifications** - Notify customers when tables are ready
- **QR Scanner** - Validate customer QR tickets
- **Table Management** - Track table availability and assignments
- **Seat Customers** - Assign customers to available tables

### Manager Features
- **Analytics Dashboard** - Comprehensive insights into operations
- **Performance Metrics** - Track wait times, table utilization, and customer flow
- **Peak Hours Analysis** - Identify busiest times
- **Activity Logs** - Monitor all system activities
- **AI Accuracy Tracking** - Monitor prediction model performance

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **AI/ML**: Custom wait time prediction algorithm

## Database Schema

The system uses Supabase with the following main tables:

- `users` - User accounts with role-based access (customer/staff/manager)
- `tables` - Restaurant table inventory
- `queue_entries` - Active and historical queue records
- `reservations` - Completed seating records
- `wait_time_history` - Data for AI model training
- `notifications` - User notifications
- `activity_logs` - System audit trail
- `system_config` - Configurable parameters

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (database is pre-configured)

### Installation

1. Install dependencies:
```bash
npm install
```

2. The Supabase database is already set up with:
   - All necessary tables and relationships
   - Row Level Security (RLS) policies
   - Sample tables (T1-T8)
   - Default configuration

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## User Roles

### Customer (Default)
- Register via the sign-up page
- Join queues and manage reservations
- View history and notifications

### Staff
- Manage active queue
- Validate QR codes
- Assign tables to customers
- Send notifications

### Manager
- Full system access
- View analytics and reports
- Monitor activity logs
- Manage system configuration

## AI Wait Time Prediction

The system uses a hybrid approach for wait time predictions:

1. **Heuristic Model** (Initial): Uses party size, queue position, and base wait times
2. **Machine Learning Model** (Progressive): Learns from historical data to improve accuracy
   - Analyzes actual vs. predicted wait times
   - Factors in time of day and day of week
   - Adjusts for party size and queue length
   - Continuously improves with more data

## Security Features

- **Authentication**: Secure email/password authentication via Supabase
- **Row Level Security**: Database-level access control
- **Role-Based Access**: Different permissions for customers, staff, and managers
- **QR Code Validation**: Unique, non-duplicable queue tickets
- **Activity Logging**: Complete audit trail of all actions
- **Password Hashing**: Secure password storage

## Mobile Responsive

All interfaces are fully optimized for mobile devices, with:
- Touch-friendly buttons and controls
- Responsive layouts for all screen sizes
- Mobile-first queue status views
- Smooth transitions and animations

## Project Structure

```
src/
├── lib/                      # Core services and utilities
│   ├── supabase.ts          # Supabase client and types
│   ├── auth.ts              # Authentication functions
│   ├── queueService.ts      # Queue management
│   ├── aiPrediction.ts      # AI wait time prediction
│   ├── tableService.ts      # Table management
│   ├── analyticsService.ts  # Analytics and reporting
│   └── notificationService.ts # Notifications
├── pages/                    # Page components
│   ├── LandingPage.tsx      # Public landing page
│   ├── LoginPage.tsx        # Login
│   ├── RegisterPage.tsx     # Registration
│   ├── CustomerDashboard.tsx # Customer interface
│   ├── StaffDashboard.tsx   # Staff interface
│   └── ManagerDashboard.tsx # Manager interface
├── App.tsx                   # Main app with routing
├── main.tsx                  # Entry point
└── index.css                 # Global styles
```

## System Configuration

Managers can configure system parameters in the `system_config` table:

- `avg_dining_duration` - Average time customers spend dining (default: 45 min)
- `operating_hours_start` - Restaurant opening time
- `operating_hours_end` - Restaurant closing time
- `max_party_size` - Maximum party size allowed
- `notification_window` - Minutes before notifying customer

## License

Educational project for ITS120/L course.

## Team

- Del Rosario, Jhun Lawrence D.
- Mirchandani, Praveen
- Sampoleo, Jose Carlos
- Ballada, John Rojerre
- Manoos, Matthew M.
