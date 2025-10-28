/*
  # Fix Performance and Security Issues

  ## Performance Improvements
  
  ### 1. Add Missing Indexes on Foreign Keys
    - `notifications.queue_entry_id` - improves join performance
    - `reservations.queue_entry_id` - improves join performance
    - `reservations.staff_id` - improves join performance
    - `wait_time_history.queue_entry_id` - improves join performance
    - Additional indexes for common query patterns

  ## Security Optimizations
  
  ### 2. Optimize RLS Policies with SELECT Subqueries
    - Replace `auth.uid()` with `(SELECT auth.uid())` in all policies
    - This prevents re-evaluation for each row, improving query performance at scale
    - Applies to all tables: users, tables, queue_entries, reservations, wait_time_history, 
      system_config, activity_logs, notifications

  ### 3. Fix Function Search Paths
    - Set immutable search paths for `update_updated_at` and `handle_new_user` functions
    - Prevents potential SQL injection vulnerabilities

  ## Notes
    - Multiple permissive policies are intentional (customers vs staff access patterns)
    - Password leak protection requires manual configuration in Supabase Dashboard
*/

-- ============================================================================
-- 1. ADD MISSING INDEXES ON FOREIGN KEYS
-- ============================================================================

-- Index for notifications.queue_entry_id
CREATE INDEX IF NOT EXISTS idx_notifications_queue_entry_id 
  ON notifications(queue_entry_id);

-- Index for notifications.user_id (also heavily queried)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON notifications(user_id);

-- Index for reservations.queue_entry_id
CREATE INDEX IF NOT EXISTS idx_reservations_queue_entry_id 
  ON reservations(queue_entry_id);

-- Index for reservations.staff_id
CREATE INDEX IF NOT EXISTS idx_reservations_staff_id 
  ON reservations(staff_id);

-- Index for wait_time_history.queue_entry_id
CREATE INDEX IF NOT EXISTS idx_wait_time_history_queue_entry_id 
  ON wait_time_history(queue_entry_id);

-- Additional performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_queue_entries_customer_id 
  ON queue_entries(customer_id);

CREATE INDEX IF NOT EXISTS idx_queue_entries_status 
  ON queue_entries(status);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id 
  ON activity_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
  ON activity_logs(created_at DESC);


-- ============================================================================
-- 2. OPTIMIZE RLS POLICIES - USERS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Staff and managers can view all users" ON users;
DROP POLICY IF EXISTS "Managers can manage users" ON users;

-- Recreate with optimized auth checks
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Staff and managers can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('staff', 'manager')
    )
  );

CREATE POLICY "Managers can manage users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role = 'manager'
    )
  );


-- ============================================================================
-- 3. OPTIMIZE RLS POLICIES - TABLES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Staff can manage tables" ON tables;

CREATE POLICY "Staff can manage tables"
  ON tables FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('staff', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('staff', 'manager')
    )
  );


-- ============================================================================
-- 4. OPTIMIZE RLS POLICIES - QUEUE_ENTRIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Customers can view own queue entries" ON queue_entries;
DROP POLICY IF EXISTS "Customers can create queue entries" ON queue_entries;
DROP POLICY IF EXISTS "Customers can update own queue entries" ON queue_entries;
DROP POLICY IF EXISTS "Staff can view all queue entries" ON queue_entries;
DROP POLICY IF EXISTS "Staff can manage queue entries" ON queue_entries;

CREATE POLICY "Customers can view own queue entries"
  ON queue_entries FOR SELECT
  TO authenticated
  USING (customer_id = (SELECT auth.uid()));

CREATE POLICY "Customers can create queue entries"
  ON queue_entries FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = (SELECT auth.uid()));

CREATE POLICY "Customers can update own queue entries"
  ON queue_entries FOR UPDATE
  TO authenticated
  USING (customer_id = (SELECT auth.uid()))
  WITH CHECK (customer_id = (SELECT auth.uid()));

CREATE POLICY "Staff can view all queue entries"
  ON queue_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('staff', 'manager')
    )
  );

CREATE POLICY "Staff can manage queue entries"
  ON queue_entries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('staff', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('staff', 'manager')
    )
  );


-- ============================================================================
-- 5. OPTIMIZE RLS POLICIES - RESERVATIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Customers can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Staff can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Staff can create reservations" ON reservations;
DROP POLICY IF EXISTS "Staff can update reservations" ON reservations;

CREATE POLICY "Customers can view own reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (customer_id = (SELECT auth.uid()));

CREATE POLICY "Staff can view all reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('staff', 'manager')
    )
  );

CREATE POLICY "Staff can create reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('staff', 'manager')
    )
  );

CREATE POLICY "Staff can update reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('staff', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('staff', 'manager')
    )
  );


-- ============================================================================
-- 6. OPTIMIZE RLS POLICIES - WAIT_TIME_HISTORY TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Managers can view wait time history" ON wait_time_history;

CREATE POLICY "Managers can view wait time history"
  ON wait_time_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role = 'manager'
    )
  );


-- ============================================================================
-- 7. OPTIMIZE RLS POLICIES - SYSTEM_CONFIG TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Managers can manage system config" ON system_config;

CREATE POLICY "Managers can manage system config"
  ON system_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role = 'manager'
    )
  );


-- ============================================================================
-- 8. OPTIMIZE RLS POLICIES - ACTIVITY_LOGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Managers can view activity logs" ON activity_logs;

CREATE POLICY "Managers can view activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role = 'manager'
    )
  );


-- ============================================================================
-- 9. OPTIMIZE RLS POLICIES - NOTIFICATIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Staff can create notifications" ON notifications;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Staff can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
      AND role IN ('staff', 'manager')
    )
  );


-- ============================================================================
-- 10. FIX FUNCTION SEARCH PATHS
-- ============================================================================

-- Recreate update_updated_at function with stable search path
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate handle_new_user function with stable search path
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$;
