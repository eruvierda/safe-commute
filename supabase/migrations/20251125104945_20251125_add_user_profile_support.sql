/*
  # Add User Tracking and Profile Support

  1. Schema Changes
    - Add `user_id` column to `reports` table to track report ownership
    - Add `deleted_at` column for soft deletes
    - Add indexes for performance

  2. Purpose
    - Track which user created each report
    - Allow users to view their own reports
    - Enable edit/delete functionality for report owners
    - Support user statistics and history
*/

-- Add user_id column to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add deleted_at for soft deletes
ALTER TABLE reports ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Create index for user's reports (excluding deleted)
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id) 
WHERE deleted_at IS NULL;

-- Create index for active reports (not deleted)
CREATE INDEX IF NOT EXISTS idx_reports_active ON reports(created_at DESC)
WHERE deleted_at IS NULL;

-- Drop and recreate get_active_reports to exclude deleted reports
DROP FUNCTION IF EXISTS get_active_reports();

CREATE OR REPLACE FUNCTION get_active_reports()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  type text,
  description text,
  latitude float8,
  longitude float8,
  is_resolved boolean,
  trust_score integer,
  last_confirmed_at timestamptz,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.created_at,
    r.type,
    r.description,
    r.latitude,
    r.longitude,
    r.is_resolved,
    r.trust_score,
    r.last_confirmed_at,
    r.user_id
  FROM reports r
  WHERE 
    -- Not deleted
    r.deleted_at IS NULL
    AND
    -- Filter by trust_score
    r.trust_score > -3
    AND
    -- Filter by TTL based on report type
    (
      -- Short-lived hazards: 3 hour TTL
      (r.type IN ('banjir', 'macet', 'kriminal') AND r.last_confirmed_at > now() - interval '3 hours')
      OR
      -- Long-lived hazards: 7 day TTL
      (r.type IN ('jalan_rusak', 'lampu_mati') AND r.last_confirmed_at > now() - interval '7 days')
    )
  ORDER BY r.created_at DESC;
END;
$$;

-- Function to get user's reports
CREATE OR REPLACE FUNCTION get_user_reports(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  type text,
  description text,
  latitude float8,
  longitude float8,
  is_resolved boolean,
  trust_score integer,
  last_confirmed_at timestamptz,
  deleted_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.created_at,
    r.type,
    r.description,
    r.latitude,
    r.longitude,
    r.is_resolved,
    r.trust_score,
    r.last_confirmed_at,
    r.deleted_at
  FROM reports r
  WHERE r.user_id = p_user_id
  ORDER BY r.created_at DESC;
END;
$$;

-- Function to update report (only if owner and within 15 minutes)
CREATE OR REPLACE FUNCTION update_user_report(
  p_report_id uuid,
  p_user_id uuid,
  p_type text,
  p_description text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_created_at timestamptz;
  v_owner_id uuid;
BEGIN
  -- Get report details
  SELECT created_at, user_id INTO v_created_at, v_owner_id
  FROM reports
  WHERE id = p_report_id AND deleted_at IS NULL;

  -- Check if report exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Report not found'
    );
  END IF;

  -- Check ownership
  IF v_owner_id != p_user_id THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Not authorized'
    );
  END IF;

  -- Check time limit (15 minutes)
  IF v_created_at < now() - interval '15 minutes' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Edit time limit exceeded (15 minutes)'
    );
  END IF;

  -- Update report
  UPDATE reports
  SET 
    type = p_type,
    description = p_description
  WHERE id = p_report_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Report updated successfully'
  );
END;
$$;

-- Function to soft delete report (only if owner)
CREATE OR REPLACE FUNCTION delete_user_report(
  p_report_id uuid,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Get report owner
  SELECT user_id INTO v_owner_id
  FROM reports
  WHERE id = p_report_id AND deleted_at IS NULL;

  -- Check if report exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Report not found'
    );
  END IF;

  -- Check ownership
  IF v_owner_id != p_user_id THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Not authorized'
    );
  END IF;

  -- Soft delete
  UPDATE reports
  SET deleted_at = now()
  WHERE id = p_report_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Report deleted successfully'
  );
END;
$$;
