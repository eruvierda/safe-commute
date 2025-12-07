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
        <div className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0 transition-opacity duration-300">
            <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto transform transition-transform duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-gray-100 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                            <ThumbsUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 font-sans">Riwayat Voting</h2>
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
                <div className="p-6">
                    {votes.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ThumbsUp className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum Ada Voting</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mb-2">Anda belum memberikan voting.</p>
                            <p className="text-sm text-gray-400">
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
                                        className="border border-gray-200 rounded-2xl p-5 hover:border-brand-200 hover:shadow-lg transition-all duration-200 bg-white group"
                                    >
                                        {/* Vote Type Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                {isUpvote ? (
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold tracking-wide">
                                                        <ThumbsUp className="w-3.5 h-3.5" />
                                                        UPVOTE
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold tracking-wide">
                                                        <ThumbsDown className="w-3.5 h-3.5" />
                                                        DOWNVOTE
                                                    </div>
                                                )}
                                                <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatRelativeDate(vote.voted_at)}
                                                </span>
                                            </div>
                                            <span className={`text-sm font-bold px-2 py-1 rounded-lg bg-gray-50 flex items-center gap-1 ${scoreColor}`}>
                                                Trust: <span className="text-lg">{vote.current_trust_score > 0 ? '+' : ''}{vote.current_trust_score}</span>
                                            </span>
                                        </div>

                                        {/* Report Details */}
                                        <div className="space-y-3 pl-1">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                                                    style={{ backgroundColor: `${reportType?.color}20`, color: reportType?.color }}
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 leading-tight">
                                                        {reportType?.label}
                                                    </h3>
                                                    {vote.is_deleted && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-bold tracking-wide mt-0.5 inline-block">
                                                            DIHAPUS
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {vote.report_description && (
                                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed italic">
                                                        "{vote.report_description}"
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 text-xs font-medium text-gray-400 pt-1">
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-gray-300" />
                                                    {vote.report_latitude.toFixed(4)}, {vote.report_longitude.toFixed(4)}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-gray-300" />
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
                        <div className="mt-8 bg-brand-50 border border-brand-100 rounded-2xl p-5 flex gap-4">
                            <div className="p-2 bg-brand-100 rounded-full h-fit">
                                <AlertCircle className="w-5 h-5 text-brand-600" />
                            </div>
                            <div className="text-sm text-brand-900">
                                <p className="font-bold mb-1">Tentang Voting</p>
                                <p className="text-brand-800 leading-relaxed text-sm">
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
