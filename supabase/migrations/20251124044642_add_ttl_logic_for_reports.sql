/*
  # Smart Expired Reports - Time-To-Live (TTL) Logic

  1. Schema Changes
    - Add `last_confirmed_at` column to `reports` table
      - Timestamptz type, defaults to now()
      - Updated whenever a user upvotes to extend report lifetime

  2. Updated RPC Functions
    - Modify `handle_vote` function
      - When vote_type = 'up', update last_confirmed_at to now()
      - This extends the life of validated reports
    
    - Create `get_active_reports` function
      - Returns only "active" reports based on TTL rules:
        - banjir, macet, kriminal: active if confirmed within 3 hours
        - jalan_rusak, lampu_mati: active if confirmed within 7 days
      - Also filters out reports with trust_score <= -3

  3. TTL Business Logic
    - Short-lived hazards (flood, traffic, crime): 3 hour TTL
    - Long-lived hazards (road damage, lights out): 7 day TTL
    - Community upvotes extend the lifetime by resetting last_confirmed_at
    - No data deletion - filtering happens at query time

  4. Benefits
    - Automatic data freshness without manual cleanup
    - Community validation extends report relevance
    - Different TTLs for different hazard types
    - Historical data preserved for analytics
*/

-- Add last_confirmed_at column to reports table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'last_confirmed_at'
  ) THEN
    ALTER TABLE reports ADD COLUMN last_confirmed_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update existing reports to have last_confirmed_at set to created_at
UPDATE reports
SET last_confirmed_at = created_at
WHERE last_confirmed_at IS NULL;

-- Create index on last_confirmed_at for efficient filtering
CREATE INDEX IF NOT EXISTS idx_reports_last_confirmed_at ON reports(last_confirmed_at DESC);

-- Drop and recreate handle_vote function with last_confirmed_at update logic
DROP FUNCTION IF EXISTS handle_vote(uuid, uuid, text);

CREATE OR REPLACE FUNCTION handle_vote(
  p_report_id uuid,
  p_user_id uuid,
  p_vote_type text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_up_count integer;
  v_down_count integer;
  v_new_trust_score integer;
  v_existing_vote_type text;
BEGIN
  -- Validate vote_type
  IF p_vote_type NOT IN ('up', 'down') THEN
    RAISE EXCEPTION 'Invalid vote_type. Must be up or down';
  END IF;

  -- Check if user already voted
  SELECT vote_type INTO v_existing_vote_type
  FROM votes
  WHERE report_id = p_report_id AND user_id = p_user_id;

  -- If user already voted with same type, do nothing
  IF v_existing_vote_type = p_vote_type THEN
    -- Calculate current trust score
    SELECT 
      COUNT(*) FILTER (WHERE vote_type = 'up'),
      COUNT(*) FILTER (WHERE vote_type = 'down')
    INTO v_up_count, v_down_count
    FROM votes
    WHERE report_id = p_report_id;

    v_new_trust_score := v_up_count - v_down_count;

    RETURN json_build_object(
      'success', true,
      'message', 'Vote already recorded',
      'trust_score', v_new_trust_score,
      'changed', false
    );
  END IF;

  -- Insert or update vote
  INSERT INTO votes (report_id, user_id, vote_type)
  VALUES (p_report_id, p_user_id, p_vote_type)
  ON CONFLICT (report_id, user_id)
  DO UPDATE SET 
    vote_type = p_vote_type,
    created_at = now();

  -- If upvote, extend the report's life by updating last_confirmed_at
  IF p_vote_type = 'up' THEN
    UPDATE reports
    SET last_confirmed_at = now()
    WHERE id = p_report_id;
  END IF;

  -- Calculate new trust score
  SELECT 
    COUNT(*) FILTER (WHERE vote_type = 'up'),
    COUNT(*) FILTER (WHERE vote_type = 'down')
  INTO v_up_count, v_down_count
  FROM votes
  WHERE report_id = p_report_id;

  v_new_trust_score := v_up_count - v_down_count;

  -- Update trust_score in reports table
  UPDATE reports
  SET trust_score = v_new_trust_score
  WHERE id = p_report_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Vote recorded successfully',
    'trust_score', v_new_trust_score,
    'up_count', v_up_count,
    'down_count', v_down_count,
    'changed', true
  );
END;
$$;

-- Create get_active_reports RPC function
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
  last_confirmed_at timestamptz
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
    r.last_confirmed_at
  FROM reports r
  WHERE 
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