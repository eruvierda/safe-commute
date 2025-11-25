/*
  # Add Voting History Function

  1. Purpose
    - Retrieve complete voting history for a user
    - Join votes and reports tables to get full report details
    - Include deleted/expired reports for history completeness

  2. Function
    - `get_user_voting_history(user_id)` - Returns all votes with report details
    - Ordered by vote timestamp (newest first)
*/

-- Function to get user's voting history with report details
CREATE OR REPLACE FUNCTION get_user_voting_history(p_user_id uuid)
RETURNS TABLE (
  vote_type text,
  voted_at timestamptz,
  report_id uuid,
  report_type text,
  report_description text,
  report_latitude float8,
  report_longitude float8,
  report_created_at timestamptz,
  current_trust_score integer,
  is_deleted boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.vote_type,
    v.created_at as voted_at,
    r.id as report_id,
    r.type as report_type,
    r.description as report_description,
    r.latitude as report_latitude,
    r.longitude as report_longitude,
    r.created_at as report_created_at,
    r.trust_score as current_trust_score,
    (r.deleted_at IS NOT NULL) as is_deleted
  FROM votes v
  INNER JOIN reports r ON v.report_id = r.id
  WHERE v.user_id = p_user_id
  ORDER BY v.created_at DESC;
END;
$$;
