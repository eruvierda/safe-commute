-- 1. Update the check constraint to allow new types
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_type_check;

ALTER TABLE reports ADD CONSTRAINT reports_type_check 
CHECK (type IN ('banjir', 'macet', 'kriminal', 'jalan_rusak', 'lampu_mati', 'banjir_rob', 'tanggul_jebol', 'kapal_tenggelam'));

-- 2. Update get_active_reports function to include new types in TTL logic
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
      (r.type IN ('banjir', 'macet', 'kriminal', 'banjir_rob') AND r.last_confirmed_at > now() - interval '3 hours')
      OR
      -- Long-lived hazards: 7 day TTL
      (r.type IN ('jalan_rusak', 'lampu_mati', 'tanggul_jebol', 'kapal_tenggelam') AND r.last_confirmed_at > now() - interval '7 days')
    )
  ORDER BY r.created_at DESC;
END;
$$;
