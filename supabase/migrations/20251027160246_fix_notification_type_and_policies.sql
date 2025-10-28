/*
  # Fix Notification Type Constraint

  1. Changes
    - Update notifications table CHECK constraint to include 'seated' type
    - This allows staff to send seated notifications to customers
  
  2. Security
    - No changes to RLS policies needed
*/

-- Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated constraint with 'seated' type
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('table_ready', 'position_update', 'cancelled', 'general', 'seated'));