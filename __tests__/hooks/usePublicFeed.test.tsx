import { renderHook, act } from '@testing-library/react-native';
import { usePublicFeed } from '../../hooks/usePublicFeed';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              then: jest.fn((resolve) =>
                resolve({
                  data: [
                    {
                      id: '1',
                      commitment_text: 'Test commitment',
                      created_at: '2024-01-01',
                      status: 'active',
                      check_ins: [],
                    },
                  ],
                  error: null,
                })
              ),
            })),
          })),
        })),
      })),
    })),
  },
}));

describe('usePublicFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      'Test commitment'
    );
  });

  it('should handle empty commitments', async () => {
    // Mock empty response
    jest.mock('../../lib/supabase', () => ({
      supabase: {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  then: jest.fn((resolve) =>
                    resolve({ data: [], error: null })
                  ),
                })),
              })),
            })),
          })),
        })),
      },
    }));

    const { result } = renderHook(() => usePublicFeed());

    await act(async () => {
      await result.current.loadCommitments();
    });

    expect(result.current.commitments).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });
});
