import { ReportType } from '../types';

/**
 * Emoji icons for each hazard category
 */
export const CATEGORY_ICONS: Record<ReportType, string> = {
    banjir: '🌊',
    macet: '🚗',
    kriminal: '⚠️',
    jalan_rusak: '🚧',
    lampu_mati: '💡',
} as const;
