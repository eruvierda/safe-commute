/*
  # Create Votes Table and Add Trust Score Column

  1. New Tables
    - `votes`
      - `report_id` (uuid, foreign key to reports) - The report being voted on
      - `user_id` (uuid) - The user who voted (stored as UUID string from localStorage)
      - `vote_type` (text) - Either 'up' or 'down'
      - `created_at` (timestamptz) - When the vote was cast
      - Composite primary key on (report_id, user_id) to prevent duplicate votes

  2. Schema Changes
    - Add `trust_score` column to `reports` table
      - Integer type, defaults to 0
      - Updated by handle_vote function

  3. Indexes
    - Index on votes.report_id for efficient vote counting
    - Index on votes.user_id for user vote history queries
    - Index on reports.trust_score for filtering

  4. Security
    - RLS policies will be added if needed
    - Currently relies on function-level security (SECURITY DEFINER)
*/

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (report_id, user_id)
);

-- Add trust_score column to reports table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'trust_score'
  ) THEN
    ALTER TABLE reports ADD COLUMN trust_score integer DEFAULT 0;
  END IF;
END $$;

-- Update existing reports to have trust_score = 0 if null
UPDATE reports
SET trust_score = 0
WHERE trust_score IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_votes_report_id ON votes(report_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_trust_score ON reports(trust_score);

-- Enable RLS on votes table (optional, for future use)
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read votes (for transparency)
CREATE POLICY "Anyone can view votes"
  ON votes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Allow anyone to insert/update votes (MVP purposes)
CREATE POLICY "Anyone can create votes"
  ON votes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update votes"
  ON votes
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

