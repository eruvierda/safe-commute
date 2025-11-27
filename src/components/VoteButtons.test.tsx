import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, MockedFunction, beforeEach } from 'vitest';
import { VoteButtons } from './VoteButtons';
import { handleVote, VoteResult } from '../supabaseClient';
import { getUserId } from '../utils/userId';

// Mock dependencies
vi.mock('../utils/userId', () => ({
  getUserId: vi.fn(() => Promise.resolve('test-user-id')),
}));

vi.mock('../supabaseClient', () => ({
  handleVote: vi.fn(),
}));

describe('VoteButtons', () => {
  const mockOnVoteSuccess = vi.fn();
  const initialProps = {
    reportId: 'report-123',
    initialTrustScore: 0,
    onVoteSuccess: mockOnVoteSuccess,
  };

  // Cast mocks to typed versions
  const mockGetUserId = getUserId as MockedFunction<typeof getUserId>;
  const mockHandleVote = handleVote as MockedFunction<typeof handleVote>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserId.mockResolvedValue('test-user-id');
  });

  it('renders correctly with initial trust score', () => {
    render(<VoteButtons {...initialProps} />);
    expect(screen.getByText('Verifikasi Komunitas:')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText('Fake')).toBeInTheDocument();
  });

  it('calls handleVote with up vote and updates trust score on success', async () => {
    mockHandleVote.mockResolvedValueOnce({
      success: true,
      trust_score: 1,
      message: 'Vote recorded',
      changed: true,
      up_count: 1,
      down_count: 0
    } as VoteResult);

    render(<VoteButtons {...initialProps} />);
    fireEvent.click(screen.getByText('Valid'));

    await waitFor(() => {
      expect(mockHandleVote).toHaveBeenCalledWith('report-123', 'test-user-id', 'up');
      expect(mockOnVoteSuccess).toHaveBeenCalledWith(1);
      expect(screen.getByText('+1')).toBeInTheDocument();
    });
  });

  it('calls handleVote with down vote and updates trust score on success', async () => {
    mockHandleVote.mockResolvedValueOnce({
      success: true,
      trust_score: -1,
      message: 'Vote recorded',
      changed: true,
      up_count: 0,
      down_count: 1
    } as VoteResult);

    render(<VoteButtons {...initialProps} />);
    fireEvent.click(screen.getByText('Fake'));

    await waitFor(() => {
      expect(mockHandleVote).toHaveBeenCalledWith('report-123', 'test-user-id', 'down');
      expect(mockOnVoteSuccess).toHaveBeenCalledWith(-1);
      expect(screen.getByText('-1')).toBeInTheDocument();
    });
  });

  it('handles vote failure', async () => {
    mockHandleVote.mockResolvedValueOnce({
      success: false,
      message: 'Already voted',
      trust_score: 0,
      changed: false
    } as VoteResult);

    render(<VoteButtons {...initialProps} />);
    fireEvent.click(screen.getByText('Valid'));

    await waitFor(() => {
      expect(mockHandleVote).toHaveBeenCalled();
      expect(screen.getByText('0')).toBeInTheDocument(); // score remains
    });
  });

  it('handles vote error', async () => {
    mockHandleVote.mockRejectedValueOnce(new Error('Network error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    render(<VoteButtons {...initialProps} />);
    fireEvent.click(screen.getByText('Valid'));

    await waitFor(() => {
      expect(mockHandleVote).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(screen.getByText('0')).toBeInTheDocument(); // score remains
    });
    consoleErrorSpy.mockRestore();
  });
});