/*
  # Fix RLS Circular Dependency Issue

  1. Problem
    - Staff and managers couldn't view other users because the policy checked their role
    - But to check their role, they needed to read their own profile first
    - This created a circular dependency

  2. Solution
    - Drop the problematic policy
    - Create a simpler policy that allows staff/managers to view all users
    - Use auth.jwt() to check the role from the JWT token instead of querying the users table
    
  3. Changes
    - Drop "Staff and managers can view all users" policy
    - Create new policy using JWT metadata for role checking
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Staff and managers can view all users" ON users;

-- Create a new policy that uses JWT metadata
-- This avoids the circular dependency by reading the role from the token
CREATE POLICY "Staff and managers can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'role' IN ('staff', 'manager'))
  );
