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

  it('keeps legitimate commitments containing formerly blacklisted words', async () => {
    getCommitmentsMock.mockResolvedValueOnce({
      data: [
        { id: 'test', commitment_text: 'Test the newsletter onboarding flow' },
      ],
      pagination: { hasNext: false },
    });
    const { result } = renderHook(() => usePublicFeed(null));
    await act(async () => {
      await result.current.loadCommitments();
    });
    expect(result.current.commitments).toHaveLength(1);
    expect(getCommitmentsMock).toHaveBeenCalledWith(undefined, {
      page: 1,
      limit: 20,
      status: null,
    });
  });

  it('retries a failed page without skipping records', async () => {
    getCommitmentsMock
      .mockResolvedValueOnce({
        data: [{ id: '1' }],
        pagination: { hasNext: true },
      })
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        data: [{ id: '1' }, { id: '2' }],
        pagination: { hasNext: false },
      });
    const { result } = renderHook(() => usePublicFeed());
    await act(async () => {
      await result.current.loadCommitments();
    });
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.error).toContain('retry');
    await act(async () => {
      await result.current.loadMore();
    });
    expect(
      getCommitmentsMock.mock.calls.slice(1).map((call) => call[1].page)
    ).toEqual([2, 2]);
    expect(result.current.commitments.map((row) => row.id)).toEqual(['1', '2']);
  });

  it('ignores an older response after a newer refresh finishes', async () => {
    let resolveOld!: (value: unknown) => void;
    getCommitmentsMock
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOld = resolve;
        })
      )
      .mockResolvedValueOnce({
        data: [{ id: 'new' }],
        pagination: { hasNext: false },
      });
    const { result } = renderHook(() => usePublicFeed());
    let old!: Promise<void>;
    await act(async () => {
      old = result.current.loadCommitments();
    });
    await act(async () => {
      await result.current.loadCommitments();
    });
    await act(async () => {
      resolveOld({ data: [{ id: 'old' }], pagination: { hasNext: true } });
      await old;
    });
    expect(result.current.commitments.map((row) => row.id)).toEqual(['new']);
    expect(result.current.hasMore).toBe(false);
  });
});
