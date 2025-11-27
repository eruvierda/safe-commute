import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './Auth/AuthModal';
import { supabase } from '../supabaseClient';

interface VoteButtonsProps {
  reportId: string;
  initialTrustScore: number;
  onVoteChange?: (newTrustScore: number) => void;
}

export function VoteButtons({ reportId, initialTrustScore, onVoteChange }: VoteButtonsProps) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [trustScore, setTrustScore] = useState(initialTrustScore);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserVote();
    } else {
      setUserVote(null);
    }
  }, [reportId, user]);

  const checkUserVote = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('report_id', reportId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking vote:', error);
        return;
      }

      if (data) {
        setUserVote(data.vote_type as 'up' | 'down');
      }
    } catch (error) {
      console.error('Error checking vote:', error);
    }
  };

  const handleVote = async (type: 'up' | 'down') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('handle_vote', {
        p_report_id: reportId,
        p_user_id: user.id,
        p_vote_type: type
      });

      if (error) throw error;

      if (data) {
        setUserVote(data.vote_type);
        setTrustScore(data.new_trust_score);
        if (onVoteChange) onVoteChange(data.new_trust_score);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
        <button
          onClick={() => handleVote('up')}
          disabled={isLoading}
          className={`p-1.5 rounded-md transition-colors ${userVote === 'up'
            ? 'bg-green-100 text-green-700'
            : 'hover:bg-gray-200 text-gray-500'
            }`}
          title="Upvote (Laporan Akurat)"
          aria-label="Upvote laporan"
        >
          <ThumbsUp className={`w-4 h-4 ${userVote === 'up' ? 'fill-current' : ''}`} />
        </button>

        <span className={`text-sm font-bold min-w-[20px] text-center ${trustScore > 0 ? 'text-green-600' : trustScore < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
          {trustScore > 0 ? '+' : ''}{trustScore}
        </span>

        <button
          onClick={() => handleVote('down')}
          disabled={isLoading}
          className={`p-1.5 rounded-md transition-colors ${userVote === 'down'
            ? 'bg-red-100 text-red-700'
            : 'hover:bg-gray-200 text-gray-500'
            }`}
          title="Downvote (Laporan Palsu/Tidak Akurat)"
          aria-label="Downvote laporan"
        >
          <ThumbsDown className={`w-4 h-4 ${userVote === 'down' ? 'fill-current' : ''}`} />
        </button>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="login"
      />
    </>
  );
}
