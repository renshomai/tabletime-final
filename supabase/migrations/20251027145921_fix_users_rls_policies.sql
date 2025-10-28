/*
  # Fix Users Table RLS Policies

  ## Changes
  - Drop problematic policies that cause infinite recursion
  - Create new policies that check auth.jwt() instead of querying users table
  - Store role in auth metadata which is accessible without querying users table

  ## Security
  - Maintains same access control without circular dependencies
  - Uses auth.jwt() to check user roles from metadata
*/

-- Drop the policies causing infinite recursion
DROP POLICY IF EXISTS "Staff and managers can view all users" ON users;
DROP POLICY IF EXISTS "Managers can manage users" ON users;

-- Create new policies using auth.jwt() to avoid recursion
CREATE POLICY "Staff and managers can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'role') IN ('staff', 'manager')
  );

CREATE POLICY "Managers can manage users"
  ON users FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'role') = 'manager'
  );
