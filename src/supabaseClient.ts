import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ReportType = 'banjir' | 'macet' | 'kriminal' | 'jalan_rusak' | 'lampu_mati';

export interface Report {
  id: string;
  created_at: string;
  type: ReportType;
  description: string | null;
  latitude: number;
  longitude: number;
  is_resolved: boolean;
  trust_score: number;
  last_confirmed_at: string;
}

export interface VoteResult {
  success: boolean;
  message: string;
  trust_score: number;
  up_count?: number;
  down_count?: number;
  changed: boolean;
}

export async function handleVote(
  reportId: string,
  userId: string,
  voteType: 'up' | 'down'
): Promise<VoteResult> {
  const { data, error } = await supabase.rpc('handle_vote', {
    p_report_id: reportId,
    p_user_id: userId,
    p_vote_type: voteType,
  });

  if (error) {
    console.error('Error handling vote:', error);
    throw error;
  }

  return data as VoteResult;
}

export async function getActiveReports(): Promise<Report[]> {
  const { data, error } = await supabase.rpc('get_active_reports');

  if (error) {
    console.error('Error fetching active reports:', error);
    throw error;
  }

  return data as Report[];
}
