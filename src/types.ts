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
  user_id?: string;
  deleted_at?: string | null;
}

export interface VoteResult {
  success: boolean;
  message: string;
  trust_score: number;
  up_count?: number;
  down_count?: number;
  changed: boolean;
}

export interface UserVote {
  vote_type: 'up' | 'down';
  voted_at: string;
  report_id: string;
  report_type: ReportType;
  report_description: string | null;
  report_latitude: number;
  report_longitude: number;
  report_created_at: string;
  current_trust_score: number;
  is_deleted: boolean;
}

export const REPORT_TYPES: { value: ReportType; label: string; color: string }[] = [
  { value: 'banjir', label: '🌊 Banjir (Flood)', color: '#3B82F6' },
  { value: 'macet', label: '🚗 Macet (Traffic)', color: '#EF4444' },
  { value: 'kriminal', label: '⚠️ Kriminal (Crime)', color: '#DC2626' },
  { value: 'jalan_rusak', label: '🚧 Jalan Rusak (Road Damage)', color: '#F59E0B' },
  { value: 'lampu_mati', label: '💡 Lampu Mati (Light Out)', color: '#6B7280' },
];
