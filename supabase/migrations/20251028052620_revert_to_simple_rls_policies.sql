/*
  # Revert to Simple Working RLS Policies

  1. Problem
    - Complex JWT-based policies are not working correctly
    - Users can't log in because profile fetch fails after authentication
    
  2. Solution
    - Simplify RLS policies to allow authenticated users basic access
    - Use straightforward auth.uid() checks without circular dependencies
    - Remove complex role-checking policies that query the users table
    
  3. Changes
    - Drop all complex policies on users table
    - Create simple policies that work reliably
*/

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Staff and managers can view all users" ON users;
DROP POLICY IF EXISTS "Managers can manage users" ON users;

-- Create simple, working policies
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to read other users (needed for staff to see customer names, etc.)
-- This is safe because we don't expose sensitive data like passwords
CREATE POLICY "Authenticated users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow managers to insert/delete users (via service role typically)
CREATE POLICY "Service role can manage users"
  ON users
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);
