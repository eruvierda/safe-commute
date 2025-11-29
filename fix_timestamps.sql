-- Update all reports to be current so they appear on the map
UPDATE reports 
SET 
  last_confirmed_at = NOW(),
  created_at = NOW()
WHERE deleted_at IS NULL;
