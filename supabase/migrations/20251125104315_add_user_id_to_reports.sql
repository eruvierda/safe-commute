/*
  # Add user_id column to reports table

  1. Changes
    - Add `user_id` column to `reports` table (nullable for existing reports)
    - Add index on user_id for performance
  
  2. Notes
    - Column is nullable to support existing reports without breaking them
    - This allows tracking which user created each report
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE reports ADD COLUMN user_id uuid;
    CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
  END IF;
END $$;