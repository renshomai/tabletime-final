/*
  # TableTime Restaurant Queue Management System - Database Schema

  ## Overview
  Creates the complete database schema for TableTime, including user management,
  queue system, table management, reservations, and analytics.

  ## New Tables
  
  ### 1. users
  - `id` (uuid, primary key) - User identifier
  - `email` (text, unique) - User email for login
  - `full_name` (text) - User's full name
  - `phone` (text) - Contact number
  - `role` (text) - User role: 'customer', 'staff', 'manager'
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. tables
  - `id` (uuid, primary key) - Table identifier
  - `table_number` (text) - Display number/name for table
  - `capacity` (integer) - Number of seats
  - `status` (text) - 'available', 'occupied', 'reserved'
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time

  ### 3. queue_entries
  - `id` (uuid, primary key) - Queue entry identifier
  - `customer_id` (uuid, foreign key) - References users table
  - `party_size` (integer) - Number of people in party
  - `status` (text) - 'waiting', 'notified', 'seated', 'cancelled', 'no_show'
  - `qr_code` (text, unique) - Unique QR code for validation
  - `position` (integer) - Current position in queue
  - `estimated_wait_time` (integer) - Predicted wait in minutes
  - `joined_at` (timestamptz) - Time customer joined queue
  - `notified_at` (timestamptz) - Time customer was notified
  - `seated_at` (timestamptz) - Time customer was seated
  - `cancelled_at` (timestamptz) - Time reservation was cancelled
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time

  ### 4. reservations
  - `id` (uuid, primary key) - Reservation identifier
  - `queue_entry_id` (uuid, foreign key) - References queue_entries
  - `table_id` (uuid, foreign key) - References tables
  - `customer_id` (uuid, foreign key) - References users
  - `staff_id` (uuid, foreign key) - Staff who seated customer
  - `party_size` (integer) - Number of people
  - `seated_at` (timestamptz) - When party was seated
  - `completed_at` (timestamptz) - When party left
  - `duration_minutes` (integer) - Actual dining duration
  - `created_at` (timestamptz) - Record creation time

  ### 5. wait_time_history
  - `id` (uuid, primary key) - History record identifier
  - `queue_entry_id` (uuid, foreign key) - References queue_entries
  - `predicted_wait_time` (integer) - AI predicted wait time
  - `actual_wait_time` (integer) - Actual time waited
  - `queue_length` (integer) - Queue length at time of prediction
  - `available_tables` (integer) - Number of available tables
  - `hour_of_day` (integer) - Hour when prediction made (0-23)
  - `day_of_week` (integer) - Day of week (0-6, 0=Sunday)
  - `created_at` (timestamptz) - Prediction timestamp

  ### 6. system_config
  - `id` (uuid, primary key) - Config identifier
  - `key` (text, unique) - Configuration key
  - `value` (text) - Configuration value
  - `description` (text) - Description of setting
  - `updated_at` (timestamptz) - Last update time

  ### 7. activity_logs
  - `id` (uuid, primary key) - Log entry identifier
  - `user_id` (uuid, foreign key) - User who performed action
  - `action` (text) - Action performed
  - `entity_type` (text) - Type of entity affected
  - `entity_id` (uuid) - ID of affected entity
  - `details` (jsonb) - Additional details
  - `created_at` (timestamptz) - Action timestamp

  ### 8. notifications
  - `id` (uuid, primary key) - Notification identifier
  - `user_id` (uuid, foreign key) - Recipient user
  - `queue_entry_id` (uuid, foreign key) - Related queue entry
  - `type` (text) - Notification type
  - `title` (text) - Notification title
  - `message` (text) - Notification message
  - `read` (boolean) - Whether notification was read
  - `created_at` (timestamptz) - Notification timestamp

  ## Security
  - RLS enabled on all tables
  - Policies enforce role-based access control
  - Users can only access their own data unless staff/manager
  - All passwords handled by Supabase Auth
  - Activity logging for accountability
*/

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'manager')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tables for restaurant
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number text NOT NULL UNIQUE,
  capacity integer NOT NULL CHECK (capacity > 0),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create queue entries table
CREATE TABLE IF NOT EXISTS queue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  party_size integer NOT NULL CHECK (party_size > 0),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'seated', 'cancelled', 'no_show')),
  qr_code text UNIQUE NOT NULL,
  position integer,
  estimated_wait_time integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  notified_at timestamptz,
  seated_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id uuid REFERENCES queue_entries(id) ON DELETE SET NULL,
  table_id uuid REFERENCES tables(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES users(id) ON DELETE SET NULL,
  party_size integer NOT NULL CHECK (party_size > 0),
  seated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_minutes integer,
  created_at timestamptz DEFAULT now()
);

-- Create wait time history for AI learning
CREATE TABLE IF NOT EXISTS wait_time_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id uuid REFERENCES queue_entries(id) ON DELETE SET NULL,
  predicted_wait_time integer NOT NULL,
  actual_wait_time integer,
  queue_length integer NOT NULL,
  available_tables integer NOT NULL,
  hour_of_day integer NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  created_at timestamptz DEFAULT now()
);

-- Create system configuration table
CREATE TABLE IF NOT EXISTS system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Create activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  queue_entry_id uuid REFERENCES queue_entries(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('table_ready', 'position_update', 'cancelled', 'general')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_queue_entries_customer ON queue_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_position ON queue_entries(position);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_table ON reservations(table_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);

-- Insert default system configuration
INSERT INTO system_config (key, value, description) VALUES
  ('avg_dining_duration', '45', 'Average dining duration in minutes'),
  ('operating_hours_start', '11:00', 'Restaurant opening time'),
  ('operating_hours_end', '22:00', 'Restaurant closing time'),
  ('max_party_size', '10', 'Maximum party size allowed'),
  ('notification_window', '5', 'Minutes before table ready to notify customer')
ON CONFLICT (key) DO NOTHING;

-- Insert sample tables
INSERT INTO tables (table_number, capacity) VALUES
  ('T1', 2),
  ('T2', 2),
  ('T3', 4),
  ('T4', 4),
  ('T5', 6),
  ('T6', 6),
  ('T7', 8),
  ('T8', 2)
ON CONFLICT (table_number) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wait_time_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff and managers can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'manager')
    )
  );

CREATE POLICY "Managers can manage users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

-- RLS Policies for tables
CREATE POLICY "Anyone can view tables"
  ON tables FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage tables"
  ON tables FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'manager')
    )
  );

-- RLS Policies for queue_entries
CREATE POLICY "Customers can view own queue entries"
  ON queue_entries FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can create queue entries"
  ON queue_entries FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own queue entries"
  ON queue_entries FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Staff can view all queue entries"
  ON queue_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'manager')
    )
  );

CREATE POLICY "Staff can manage queue entries"
  ON queue_entries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'manager')
    )
  );

-- RLS Policies for reservations
CREATE POLICY "Customers can view own reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Staff can view all reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'manager')
    )
  );

CREATE POLICY "Staff can create reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'manager')
    )
  );

CREATE POLICY "Staff can update reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'manager')
    )
  );

-- RLS Policies for wait_time_history
CREATE POLICY "Managers can view wait time history"
  ON wait_time_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

CREATE POLICY "System can insert wait time history"
  ON wait_time_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for system_config
CREATE POLICY "Anyone can view system config"
  ON system_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage system config"
  ON system_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

-- RLS Policies for activity_logs
CREATE POLICY "Managers can view activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'manager')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_queue_entries_updated_at
  BEFORE UPDATE ON queue_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();