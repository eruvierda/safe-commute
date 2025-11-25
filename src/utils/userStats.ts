import { supabase } from '../supabaseClient';
import type { Report, UserVote } from '../types';

export interface UserStats {
    totalReports: number;
    totalVotes: number;
    averageTrustScore: number;
    mostReportedType: string;
    accountAgeDays: number;
}

/**
 * Get all reports created by a specific user
 */
export async function getUserReports(userId: string): Promise<Report[]> {
    const { data, error } = await supabase.rpc('get_user_reports', {
        p_user_id: userId,
    });

    if (error) {
        console.error('Error fetching user reports:', error);
        throw error;
    }

    return data as Report[];
}

/**
 * Update a report (only if owner and within 15 minutes)
 */
export async function updateUserReport(
    reportId: string,
    userId: string,
    type: string,
    description: string
): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('update_user_report', {
        p_report_id: reportId,
        p_user_id: userId,
        p_type: type,
        p_description: description,
    });

    if (error) {
        console.error('Error updating report:', error);
        throw error;
    }

    return data as { success: boolean; message: string };
}

/**
 * Delete a report (soft delete, only if owner)
 */
export async function deleteUserReport(
    reportId: string,
    userId: string
): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('delete_user_report', {
        p_report_id: reportId,
        p_user_id: userId,
    });

    if (error) {
        console.error('Error deleting report:', error);
        throw error;
    }

    return data as { success: boolean; message: string };
}

/**
 * Get all votes cast by a specific user with report details
 */
export async function getUserVotingHistory(userId: string): Promise<UserVote[]> {
    const { data, error } = await supabase.rpc('get_user_voting_history', {
        p_user_id: userId,
    });

    if (error) {
        console.error('Error fetching user voting history:', error);
        throw error;
    }

    return data as UserVote[];
}

/**
 * Calculate user statistics
 */
export async function getUserStats(userId: string, reports: Report[]): Promise<UserStats> {
    const userReports = reports.filter(r => r.user_id === userId && !r.deleted_at);

    const totalReports = userReports.length;
    const averageTrustScore = totalReports > 0
        ? userReports.reduce((sum, r) => sum + r.trust_score, 0) / totalReports
        : 0;

    // Count report types
    const typeCounts: Record<string, number> = {};
    userReports.forEach(r => {
        typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    });

    const mostReportedType = Object.keys(typeCounts).length > 0
        ? Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0]
        : 'none';

    // Calculate account age (days since first report)
    const firstReport = userReports.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0];

    const accountAgeDays = firstReport
        ? Math.floor((Date.now() - new Date(firstReport.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    // Get actual vote count
    let totalVotes = 0;
    try {
        const votes = await getUserVotingHistory(userId);
        totalVotes = votes.length;
    } catch (error) {
        console.error('Error getting vote count:', error);
    }

    return {
        totalReports,
        totalVotes,
        averageTrustScore: Math.round(averageTrustScore * 10) / 10,
        mostReportedType,
        accountAgeDays,
    };
}

/**
 * Check if user can edit a report (within 15 minutes)
 */
export function canEditReport(createdAt: string): boolean {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - created.getTime()) / 60000;
    return diffMinutes < 15;
}
