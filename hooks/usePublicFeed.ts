import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/cachedSupabase';
import { PaginationService } from '../lib/apiPagination';
import { Commitment } from '../types/commitment';

const PAGE_SIZE = 20;

export interface UsePublicFeedReturn {
  commitments: Commitment[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  loadCommitments: (
    statusFilter?: 'active' | 'completed' | 'abandoned' | null
  ) => Promise<void>;
  loadMore: (
    statusFilter?: 'active' | 'completed' | 'abandoned' | null
  ) => Promise<void>;
}

export function usePublicFeed(
  statusFilter: 'active' | 'completed' | 'abandoned' | null = 'active'
): UsePublicFeedReturn {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusRef = useRef(statusFilter);
  statusRef.current = statusFilter;

  const loadCommitments = async (
    overrideStatus?: 'active' | 'completed' | 'abandoned' | null
  ) => {
    const filter =
      overrideStatus !== undefined ? overrideStatus : statusRef.current;
    try {
      setError(null);
      setLoading(true);

      // Use pagination service with caching
      const response = await PaginationService.getCommitments(undefined, {
        page: 1,
        limit: PAGE_SIZE,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      let data = response.data || [];

      // Apply status filter if needed
      if (filter) {
        data = data.filter((c: any) => c.status === filter);
      }

      const cleaned = data.filter((c: any) => {
        const t = c.commitment_text?.toLowerCase() || '';
        if (t.includes('newsletter') || t.includes('onboarding flow'))
          return false;
        if (t.includes('test')) return false;
        return true;
      }) as Commitment[];

      setCommitments(cleaned);
      setHasMore(response.pagination?.hasNext || false);
      setCursor(cleaned.length ? cleaned[cleaned.length - 1].created_at : null);
    } catch (err) {
      console.error('Error:', err);
      setError('Something went wrong');
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMore = async (
    overrideStatus?: 'active' | 'completed' | 'abandoned' | null
  ) => {
    const filter =
      overrideStatus !== undefined ? overrideStatus : statusRef.current;
    if (!hasMore || isFetchingMore) return;

    try {
      setIsFetchingMore(true);
      setError(null);

      // Calculate current page based on loaded items
      const currentPage = Math.ceil(commitments.length / PAGE_SIZE) + 1;

      // Use pagination service with caching
      const response = await PaginationService.getCommitments(undefined, {
        page: currentPage,
        limit: PAGE_SIZE,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      let data = response.data || [];

      // Apply status filter if needed
      if (filter) {
        data = data.filter((c: any) => c.status === filter);
      }

      const cleaned = data.filter((c: any) => {
        const t = c.commitment_text?.toLowerCase() || '';
        if (t.includes('newsletter') || t.includes('onboarding flow'))
          return false;
        if (t.includes('test')) return false;
        return true;
      }) as Commitment[];

      setCommitments((prev) => [...prev, ...cleaned]);
      setHasMore(response.pagination?.hasNext || false);
      setCursor(
        cleaned.length ? cleaned[cleaned.length - 1].created_at : cursor
      );
    } catch (err) {
      console.error('Error:', err);
      setError('Something went wrong');
      setHasMore(false);
    } finally {
      setIsFetchingMore(false);
    }
  };

  return {
    commitments,
    loading,
    refreshing,
    error,
    hasMore,
    loadCommitments,
    loadMore,
  };
}
