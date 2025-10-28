/*
  # Add automatic queue position management

  1. Changes
    - Create a trigger function to automatically assign positions based on joined_at
    - Create trigger to run on insert and update of queue_entries
    - Ensures positions are always correct based on join time order

  2. How it works
    - When a new entry is inserted, it automatically gets the correct position
    - When entries are updated (status changes), positions are recalculated
    - Position is based on joined_at timestamp (first come, first served)
*/

-- Function to automatically manage queue positions
CREATE OR REPLACE FUNCTION manage_queue_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- Only manage positions for waiting and notified entries
  IF NEW.status IN ('waiting', 'notified') THEN
    -- Calculate position based on joined_at order
    NEW.position := (
      SELECT COUNT(*) + 1
      FROM queue_entries
      WHERE status IN ('waiting', 'notified')
        AND joined_at < NEW.joined_at
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for insert
DROP TRIGGER IF EXISTS set_queue_position_on_insert ON queue_entries;
CREATE TRIGGER set_queue_position_on_insert
  BEFORE INSERT ON queue_entries
  FOR EACH ROW
  EXECUTE FUNCTION manage_queue_positions();

-- Function to reorder all queue positions after changes
CREATE OR REPLACE FUNCTION reorder_all_queue_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- Update positions for all active queue entries
  WITH ordered_queue AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY joined_at ASC) as new_position
    FROM queue_entries
    WHERE status IN ('waiting', 'notified')
  )
  UPDATE queue_entries
  SET position = ordered_queue.new_position
  FROM ordered_queue
  WHERE queue_entries.id = ordered_queue.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status updates (when someone cancels or gets seated)
DROP TRIGGER IF EXISTS reorder_queue_on_update ON queue_entries;
CREATE TRIGGER reorder_queue_on_update
  AFTER UPDATE OF status ON queue_entries
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION reorder_all_queue_positions();
