/*
  # Fix RLS Policy to Use JWT Metadata

  1. Problem
    - The previous fix tried to use auth.jwt()->>'role' but role is in user_metadata
    - Need to access raw_user_meta_data from the JWT

  2. Solution
    - Update policy to read from auth.jwt()->'user_metadata'->>'role'
    - This avoids circular dependency by reading directly from the JWT token
*/

-- Drop the policy we just created
DROP POLICY IF EXISTS "Staff and managers can view all users" ON users;

-- Create the correct policy using user_metadata from JWT
CREATE POLICY "Staff and managers can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->'user_metadata'->>'role' IN ('staff', 'manager'))
  );
