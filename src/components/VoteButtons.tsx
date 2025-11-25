import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { handleVote } from '../supabaseClient';
import { getUserId } from '../utils/userId';

interface VoteButtonsProps {
  reportId: string;
  initialTrustScore: number;
  onVoteSuccess: (newTrustScore: number) => void;
}

export function VoteButtons({ reportId, initialTrustScore, onVoteSuccess }: VoteButtonsProps) {
  const [trustScore, setTrustScore] = useState(initialTrustScore);
  const [isVoting, setIsVoting] = useState(false);

  const handleVoteClick = async (voteType: 'up' | 'down') => {
    setIsVoting(true);
    try {
      const userId = getUserId();
      const result = await handleVote(reportId, userId, voteType);

      if (result.success) {
        setTrustScore(result.trust_score);
        onVoteSuccess(result.trust_score);
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Gagal memberikan suara. Silakan coba lagi.');
    } finally {
      setIsVoting(false);
    }
  };

  const scoreColor = trustScore > 0 ? 'text-green-600' : trustScore < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">Verifikasi Komunitas:</span>
        <span className={`text-sm font-bold ${scoreColor}`}>
          {trustScore > 0 ? '+' : ''}{trustScore}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleVoteClick('up')}
          disabled={isVoting}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          aria-label="Tandai laporan ini sebagai valid"
          title="Laporan ini valid"
        >
          <ThumbsUp className="w-4 h-4" />
          Valid
        </button>
        <button
          onClick={() => handleVoteClick('down')}
          disabled={isVoting}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          aria-label="Tandai laporan ini sebagai palsu atau tidak relevan"
          title="Laporan ini palsu atau sudah tidak relevan"
        >
          <ThumbsDown className="w-4 h-4" />
          Fake
        </button>
      </div>
    </div>
  );
}
