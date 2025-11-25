import { createClient } from '@supabase/supabase-js';
import type { Report, VoteResult } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Re-export types for convenience
export type { Report, VoteResult } from './types';

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
