/*
  # SafeCommute - Hazard Mapping Database Schema

  1. Extensions
    - Enable PostGIS for geospatial functionality

  2. New Tables
    - `reports`
      - `id` (uuid, primary key) - Unique identifier for each report
      - `created_at` (timestamptz) - Timestamp when report was created
      - `type` (text) - Type of hazard (banjir, macet, kriminal, jalan_rusak, lampu_mati)
      - `description` (text, nullable) - Optional description of the hazard
      - `latitude` (float8) - Latitude coordinate of the hazard
      - `longitude` (float8) - Longitude coordinate of the hazard
      - `is_resolved` (boolean) - Whether the hazard has been resolved

  3. Security
    - Enable RLS on `reports` table
    - Add policy for public read access (anyone can view reports)
    - Add policy for public insert access (anyone can create reports for MVP)

  4. Important Notes
    - PostGIS extension is required for future geospatial queries
    - Public access policies are for MVP purposes only
    - In production, consider adding authentication and user tracking
*/

-- Enable PostGIS extension for geospatial functionality
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  type text NOT NULL CHECK (type IN ('banjir', 'macet', 'kriminal', 'jalan_rusak', 'lampu_mati')),
  description text,
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  is_resolved boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read all reports
CREATE POLICY "Anyone can view reports"
  ON reports
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Allow anyone to insert reports (MVP purposes)
CREATE POLICY "Anyone can create reports"
  ON reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Allow anyone to update reports to mark as resolved (MVP purposes)
CREATE POLICY "Anyone can update reports"
  ON reports
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create index on created_at for efficient sorting
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Create index on is_resolved for filtering
CREATE INDEX IF NOT EXISTS idx_reports_is_resolved ON reports(is_resolved);

-- Create index on type for filtering by hazard type
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);