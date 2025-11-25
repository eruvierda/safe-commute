/*
  # Optimize RLS Policies for Performance

  1. Purpose
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - This prevents re-evaluation of auth.uid() for each row
    - Significantly improves query performance at scale

  2. Changes
    - Recreate profiles table policies with optimized auth function calls
    - Recreate reports table policies with optimized auth function calls
    - Recreate votes table policies with optimized auth function calls

  3. Security
    - Maintains same security requirements
    - Only changes performance optimization
*/

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((select auth.uid()) = id);

-- ============================================
-- REPORTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view active reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
DROP POLICY IF EXISTS "Users can update own reports" ON reports;

CREATE POLICY "Anyone can view active reports"
  ON reports FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own reports"
  ON reports FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================
-- VOTES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON votes;
DROP POLICY IF EXISTS "Authenticated users can update own votes" ON votes;

CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can update own votes"
  ON votes FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);
