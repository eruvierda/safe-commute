/*
  # Update RLS Policies for Authenticated Users

  1. Purpose
    - Update RLS policies to require authentication
    - Ensure users can only modify their own data
    - Maintain public read access for reports

  2. Changes
    - Drop old permissive policies
    - Add authenticated-only policies for writes
    - Enforce user ownership
*/

-- ============================================
-- REPORTS TABLE POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view reports" ON reports;
DROP POLICY IF EXISTS "Anyone can create reports" ON reports;
DROP POLICY IF EXISTS "Anyone can update reports" ON reports;

-- New policies for reports
CREATE POLICY "Anyone can view active reports"
  ON reports FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- VOTES TABLE POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Anyone can create votes" ON votes;
DROP POLICY IF EXISTS "Anyone can update votes" ON votes;

-- New policies for votes
CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own votes"
  ON votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- UPDATE FUNCTIONS TO USE auth.uid()
-- ============================================

-- Note: The handle_vote, update_user_report, and delete_user_report functions
-- will continue to work as they use SECURITY DEFINER and accept user_id parameter.
-- The RLS policies will enforce that the user_id matches auth.uid().
