-- SafeCommute Complete Database Schema

-- Enable PostGIS for geospatial features (optional but recommended)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    trust_score INTEGER DEFAULT 0,
    last_confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    image_url TEXT, -- Added for photo evidence
    deleted_at TIMESTAMPTZ
);

-- 2. Votes Table
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    vote_type TEXT CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_id, user_id)
);

-- 3. Profiles Table (Fix for PGRST116 error)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMPTZ,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Row Level Security (RLS)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Reports Policies
CREATE POLICY "Public read access" ON public.reports 
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Authenticated insert access" ON public.reports 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owner update access" ON public.reports 
    FOR UPDATE USING (auth.uid() = user_id);

-- Votes Policies
CREATE POLICY "Public read access" ON public.votes 
    FOR SELECT USING (true);

CREATE POLICY "Authenticated insert/update access" ON public.votes 
    FOR ALL USING (auth.role() = 'authenticated');

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hazard-photos', 'hazard-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" ON storage.objects 
    FOR SELECT USING ( bucket_id = 'hazard-photos' );

CREATE POLICY "Authenticated Upload" ON storage.objects 
    FOR INSERT WITH CHECK ( bucket_id = 'hazard-photos' AND auth.role() = 'authenticated' );

-- 6. RPC Functions & Triggers

-- Function to handle voting logic
CREATE OR REPLACE FUNCTION handle_vote(
  p_report_id UUID,
  p_user_id UUID,
  p_vote_type TEXT
) RETURNS JSONB AS $$
DECLARE
  v_trust_score INTEGER;
  v_vote_exists BOOLEAN;
  v_old_vote_type TEXT;
BEGIN
  -- Check if vote exists
  SELECT EXISTS(SELECT 1 FROM votes WHERE report_id = p_report_id AND user_id = p_user_id), vote_type
  INTO v_vote_exists, v_old_vote_type
  FROM votes WHERE report_id = p_report_id AND user_id = p_user_id;

  IF v_vote_exists THEN
    IF v_old_vote_type = p_vote_type THEN
      -- Remove vote if same
      DELETE FROM votes WHERE report_id = p_report_id AND user_id = p_user_id;
      IF p_vote_type = 'up' THEN
        UPDATE reports SET trust_score = trust_score - 1 WHERE id = p_report_id;
      ELSE
        UPDATE reports SET trust_score = trust_score + 1 WHERE id = p_report_id;
      END IF;
    ELSE
      -- Change vote
      UPDATE votes SET vote_type = p_vote_type WHERE report_id = p_report_id AND user_id = p_user_id;
      IF p_vote_type = 'up' THEN
        UPDATE reports SET trust_score = trust_score + 2 WHERE id = p_report_id;
      ELSE
        UPDATE reports SET trust_score = trust_score - 2 WHERE id = p_report_id;
      END IF;
    END IF;
  ELSE
    -- New vote
    INSERT INTO votes (report_id, user_id, vote_type) VALUES (p_report_id, p_user_id, p_vote_type);
    IF p_vote_type = 'up' THEN
      UPDATE reports SET trust_score = trust_score + 1 WHERE id = p_report_id;
    ELSE
      UPDATE reports SET trust_score = trust_score - 1 WHERE id = p_report_id;
    END IF;
  END IF;

  -- Get new trust score
  SELECT trust_score INTO v_trust_score FROM reports WHERE id = p_report_id;

  RETURN jsonb_build_object(
    'success', true,
    'trust_score', v_trust_score
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active reports
CREATE OR REPLACE FUNCTION get_active_reports()
RETURNS SETOF reports AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM reports
  WHERE deleted_at IS NULL
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
