import { renderHook, act } from '@testing-library/react-native';
import { usePublicFeed } from '../../hooks/usePublicFeed';
import { PaginationService } from '../../lib/apiPagination';

jest.mock('../../lib/apiPagination', () => ({
  PaginationService: {
    getCommitments: jest.fn(),
  },
}));

describe('usePublicFeed', () => {
  const getCommitmentsMock = PaginationService.getCommitments as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    getCommitmentsMock.mockResolvedValue({
      data: [
        {
          id: '1',
          commitment_text: 'Ship my customer interview script',
          created_at: '2024-01-01',
          status: 'active',
          check_ins: [],
        },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        hasNext: false,
        hasPrev: false,
      },
    });
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => usePublicFeed());

    expect(result.current.loading).toBe(true);
    expect(result.current.commitments).toEqual([]);
    expect(result.current.hasMore).toBe(true);
  });

  it('should load commitments successfully', async () => {
    const { result } = renderHook(() => usePublicFeed());

    await act(async () => {
      await result.current.loadCommitments();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.commitments).toHaveLength(1);
    expect(result.current.commitments[0].commitment_text).toBe(
      'Ship my customer interview script'
    );
  });

  it('should handle empty commitments', async () => {
    getCommitmentsMock.mockResolvedValueOnce({
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
      },
    });

    const { result } = renderHook(() => usePublicFeed());

    await act(async () => {
      await result.current.loadCommitments();
    });

    expect(result.current.commitments).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });
});
