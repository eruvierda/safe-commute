export type ReportType = 'banjir' | 'macet' | 'kriminal' | 'jalan_rusak' | 'lampu_mati';

export interface Report {
  id: string;
  created_at: string;
  type: ReportType;
  description: string | null;
  latitude: number;
  longitude: number;
  is_resolved: boolean;
}

export const REPORT_TYPES: { value: ReportType; label: string; color: string }[] = [
  { value: 'banjir', label: '🌊 Banjir (Flood)', color: '#3B82F6' },
  { value: 'macet', label: '🚗 Macet (Traffic)', color: '#EF4444' },
  { value: 'kriminal', label: '⚠️ Kriminal (Crime)', color: '#DC2626' },
  { value: 'jalan_rusak', label: '🚧 Jalan Rusak (Road Damage)', color: '#F59E0B' },
  { value: 'lampu_mati', label: '💡 Lampu Mati (Light Out)', color: '#6B7280' },
];
