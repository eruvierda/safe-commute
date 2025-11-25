import { X, ThumbsUp, ThumbsDown, MapPin, Clock, AlertCircle } from 'lucide-react';
import { REPORT_TYPES, type UserVote } from '../types';
import { formatRelativeDate } from '../utils/dateFormatter';

interface VotingHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    votes: UserVote[];
}

export function VotingHistory({ isOpen, onClose, votes }: VotingHistoryProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white w-full sm:max-w-2xl sm:rounded-lg rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-xl font-semibold text-gray-900">Riwayat Voting</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {votes.length === 0 ? (
                        <div className="text-center py-12">
                            <ThumbsUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">Anda belum memberikan voting</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Vote pada laporan untuk membantu komunitas memverifikasi informasi
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {votes.map((vote) => {
                                const reportType = REPORT_TYPES.find(t => t.value === vote.report_type);
                                const isUpvote = vote.vote_type === 'up';
                                const scoreColor = vote.current_trust_score > 0
                                    ? 'text-green-600'
                                    : vote.current_trust_score < 0
                                        ? 'text-red-600'
                                        : 'text-gray-600';

                                return (
                                    <div
                                        key={`${vote.report_id}-${vote.voted_at}`}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                                    >
                                        {/* Vote Type Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                {isUpvote ? (
                                                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">
                                                        <ThumbsUp className="w-4 h-4" />
                                                        UPVOTE
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium">
                                                        <ThumbsDown className="w-4 h-4" />
                                                        DOWNVOTE
                                                    </div>
                                                )}
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatRelativeDate(vote.voted_at)}
                                                </span>
                                            </div>
                                            <span className={`text-sm font-bold ${scoreColor}`}>
                                                Trust: {vote.current_trust_score > 0 ? '+' : ''}{vote.current_trust_score}
                                            </span>
                                        </div>

                                        {/* Report Details */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: reportType?.color }}
                                                />
                                                <h3 className="font-semibold text-gray-900">
                                                    {reportType?.label}
                                                </h3>
                                                {vote.is_deleted && (
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                        DIHAPUS
                                                    </span>
                                                )}
                                            </div>

                                            {vote.report_description && (
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {vote.report_description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {vote.report_latitude.toFixed(4)}, {vote.report_longitude.toFixed(4)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Dilaporkan {formatRelativeDate(vote.report_created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Info */}
                    {votes.length > 0 && (
                        <div className="mt-6 bg-blue-50 rounded-lg p-4 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900">
                                <p className="font-medium mb-1">Tentang Voting</p>
                                <p className="text-blue-800">
                                    Voting Anda membantu komunitas memverifikasi akurasi laporan.
                                    Laporan dengan trust score tinggi lebih dipercaya oleh pengguna lain.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
