import { X, User, FileText, ThumbsUp, TrendingUp, Calendar, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
    const { user, profile } = useAuth();
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
        if (!user) return;

        setIsLoading(true);
        try {
            const userId = user.id;
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
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0 transition-opacity duration-300">
            <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto transform transition-transform duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-gray-100 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-brand-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 font-sans">Profil Saya</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
                            <p className="mt-4 text-gray-500 font-medium">Memuat data...</p>
                        </div>
                    ) : (
                        <>
                            {/* User Info */}
                            <div className="flex items-center gap-4 bg-brand-50/50 p-4 rounded-2xl border border-brand-100">
                                {profile?.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile?.display_name || 'User'}
                                        className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-2 border-brand-100 shadow-sm">
                                        <User className="w-8 h-8 text-brand-600" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{profile?.display_name || 'Pengguna'}</h3>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                        <Mail className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[200px]">{user?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-brand-600 text-xs font-medium mt-1.5 bg-brand-100/50 inline-flex px-2 py-0.5 rounded-full">
                                        <Calendar className="w-3 h-3" />
                                        <span>Member sejak {new Date(user?.created_at || Date.now()).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Statistics Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-blue-100 rounded-lg">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Laporan</span>
                                    </div>
                                    <p className="text-3xl font-bold text-blue-700">{stats?.totalReports || 0}</p>
                                </div>

                                <div className="bg-green-50/80 rounded-2xl p-4 border border-green-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-green-100 rounded-lg">
                                            <ThumbsUp className="w-4 h-4 text-green-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">Trust Score</span>
                                    </div>
                                    <p className="text-3xl font-bold text-green-700">
                                        {stats?.averageTrustScore.toFixed(1) || '0.0'}
                                    </p>
                                </div>

                                <div className="bg-purple-50/80 rounded-2xl p-4 border border-purple-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-purple-100 rounded-lg">
                                            <TrendingUp className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-purple-800 uppercase tracking-wide">Top Kategori</span>
                                    </div>
                                    <p className="text-sm font-bold text-purple-700 line-clamp-2">
                                        {getMostReportedTypeLabel()}
                                    </p>
                                </div>

                                <div className="bg-orange-50/80 p-4 rounded-2xl border border-orange-100">
                                    <div className="flex items-center gap-2 text-orange-800 mb-2">
                                        <div className="p-1.5 bg-orange-100 rounded-lg">
                                            <Calendar className="w-4 h-4 text-orange-600" />
                                        </div>
                                        <span className="text-xs font-semibold uppercase tracking-wide">Usia Akun</span>
                                    </div>
                                    <div className="text-3xl font-bold text-orange-700">
                                        {Math.floor((Date.now() - new Date(user?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24))}
                                        <span className="text-sm font-medium ml-1">hari</span>
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    <strong className="text-gray-700">Catatan:</strong> Anda dapat mengedit laporan dalam 15 menit pertama setelah dibuat.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3 pt-2">
                                {/* My Reports Button */}
                                <button
                                    onClick={() => setShowMyReports(true)}
                                    className="w-full px-6 py-4 bg-brand-600 text-white rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-all font-semibold flex items-center justify-center gap-3 shadow-lg shadow-brand-200 hover:shadow-brand-300 transform active:scale-[0.98]"
                                >
                                    <FileText className="w-5 h-5" />
                                    Lihat Laporan Saya ({userReports.filter(r => !r.deleted_at).length})
                                </button>

                                {/* Voting History Button */}
                                <button
                                    onClick={() => setShowVotingHistory(true)}
                                    className="w-full px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:bg-purple-800 transition-all font-semibold flex items-center justify-center gap-3 shadow-lg shadow-purple-200 hover:shadow-purple-300 transform active:scale-[0.98]"
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
