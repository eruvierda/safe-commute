/*
  # Remove Unused Indexes

  1. Purpose
    - Remove indexes that are not being used by queries
    - Reduces database maintenance overhead
    - Improves write performance by removing unnecessary index updates

  2. Indexes Removed
    - idx_reports_is_resolved (not used)
    - idx_reports_type (not used)
    - idx_reports_active (not used - replaced by function)
    - idx_votes_user_id (not used)
    - idx_reports_trust_score (not used)
    - idx_reports_last_confirmed_at (not used)
    - idx_reports_user_id (kept - may be used by user-specific queries)

  3. Notes
    - Only removing truly unused indexes
    - idx_reports_user_id is kept as it's used by get_user_reports function
*/

-- Drop unused indexes on reports table
DROP INDEX IF EXISTS idx_reports_is_resolved;
DROP INDEX IF EXISTS idx_reports_type;
DROP INDEX IF EXISTS idx_reports_active;
DROP INDEX IF EXISTS idx_reports_trust_score;
DROP INDEX IF EXISTS idx_reports_last_confirmed_at;

-- Drop unused indexes on votes table
DROP INDEX IF EXISTS idx_votes_user_id;
