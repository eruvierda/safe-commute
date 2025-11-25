import { X, User, FileText, ThumbsUp, TrendingUp, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUserId } from '../utils/userId';
import { getUserReports, getUserVotingHistory } from '../utils/userStats';
import { getUserStats, type UserStats } from '../utils/userStats';
import { REPORT_TYPES, type Report, type UserVote } from '../types';
import { MyReports } from './MyReports';
import { VotingHistory } from './VotingHistory';

interface UserProfileProps {
    isOpen: boolean;
    onClose: () => void;
    allReports: Report[];
}

export function UserProfile({ isOpen, onClose, allReports }: UserProfileProps) {
    const [userReports, setUserReports] = useState<Report[]>([]);
    const [userVotes, setUserVotes] = useState<UserVote[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showMyReports, setShowMyReports] = useState(false);
    const [showVotingHistory, setShowVotingHistory] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadUserData();
        }
    }, [isOpen, allReports]);

    const loadUserData = async () => {
        setIsLoading(true);
        try {
            const userId = getUserId();
            const reports = await getUserReports(userId);
            setUserReports(reports);

            const votes = await getUserVotingHistory(userId);
            setUserVotes(votes);

            const userStats = await getUserStats(userId, allReports);
            setStats(userStats);
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    if (showMyReports) {
        return (
            <MyReports
                isOpen={true}
                onClose={() => setShowMyReports(false)}
                reports={userReports}
                onReportUpdated={loadUserData}
            />
        );
    }

    if (showVotingHistory) {
        return (
            <VotingHistory
                isOpen={true}
                onClose={() => setShowVotingHistory(false)}
                votes={userVotes}
            />
        );
    }

    const getMostReportedTypeLabel = () => {
        if (!stats || stats.mostReportedType === 'none') return 'Belum ada';
        const type = REPORT_TYPES.find(t => t.value === stats.mostReportedType);
        return type?.label || stats.mostReportedType;
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white w-full sm:max-w-md sm:rounded-lg rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Profil Saya</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Memuat data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Statistics Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm text-gray-600">Total Laporan</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600">{stats?.totalReports || 0}</p>
                                </div>

                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ThumbsUp className="w-5 h-5 text-green-600" />
                                        <span className="text-sm text-gray-600">Rata-rata Trust</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">
                                        {stats?.averageTrustScore.toFixed(1) || '0.0'}
                                    </p>
                                </div>

                                <div className="bg-purple-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-purple-600" />
                                        <span className="text-sm text-gray-600">Paling Sering</span>
                                    </div>
                                    <p className="text-sm font-semibold text-purple-600">
                                        {getMostReportedTypeLabel()}
                                    </p>
                                </div>

                                <div className="bg-orange-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-5 h-5 text-orange-600" />
                                        <span className="text-sm text-gray-600">Usia Akun</span>
                                    </div>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {stats?.accountAgeDays || 0}
                                        <span className="text-sm font-normal ml-1">hari</span>
                                    </p>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600">
                                    <strong>Catatan:</strong> Anda dapat mengedit laporan dalam 15 menit pertama setelah dibuat.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {/* My Reports Button */}
                                <button
                                    onClick={() => setShowMyReports(true)}
                                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <FileText className="w-5 h-5" />
                                    Lihat Laporan Saya ({userReports.filter(r => !r.deleted_at).length})
                                </button>

                                {/* Voting History Button */}
                                <button
                                    onClick={() => setShowVotingHistory(true)}
                                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <ThumbsUp className="w-5 h-5" />
                                    Riwayat Voting ({userVotes.length})
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
