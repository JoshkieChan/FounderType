import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Commitment } from '../types/commitment';

const PAGE_SIZE = 20;

export interface UsePublicFeedReturn {
  commitments: Commitment[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  loadCommitments: (statusFilter?: 'active' | 'completed' | 'abandoned' | null) => Promise<void>;
  loadMore: (statusFilter?: 'active' | 'completed' | 'abandoned' | null) => Promise<void>;
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

  const loadCommitments = useCallback(
    async (overrideStatus?: 'active' | 'completed' | 'abandoned' | null) => {
      const filter = overrideStatus !== undefined ? overrideStatus : statusRef.current;
      try {
        setError(null);
        setLoading(true);

        let query = supabase
          .from('commitments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE);

        if (filter) {
          query = query.eq('status', filter);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error loading commitments:', error);
          setCommitments([]);
          setHasMore(false);
          return;
        }

        const cleaned = (data || []).filter(c => {
          const t = c.commitment_text.toLowerCase();
          if (t.includes('newsletter') || t.includes('onboarding flow')) return false;
          if (t.includes('test')) return false;
          return true;
        }) as Commitment[];

        setCommitments(cleaned);
        setHasMore(cleaned.length === PAGE_SIZE);
        setCursor(cleaned.length ? cleaned[cleaned.length - 1].created_at : null);
      } catch (err) {
        console.error('Error:', err);
        setError('Something went wrong');
        setHasMore(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  const loadMore = useCallback(
    async (overrideStatus?: 'active' | 'completed' | 'abandoned' | null) => {
      const filter = overrideStatus !== undefined ? overrideStatus : statusRef.current;
      if (!hasMore || !cursor || isFetchingMore) return;

      try {
        setIsFetchingMore(true);
        setError(null);

        let query = supabase
          .from('commitments')
          .select('*')
          .order('created_at', { ascending: false })
          .lt('created_at', cursor)
          .limit(PAGE_SIZE);

        if (filter) {
          query = query.eq('status', filter);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error loading more commitments:', error);
          setHasMore(false);
          return;
        }

        const cleaned = (data || []).filter(c => {
          const t = c.commitment_text.toLowerCase();
          if (t.includes('newsletter') || t.includes('onboarding flow')) return false;
          if (t.includes('test')) return false;
          return true;
        }) as Commitment[];

        setCommitments(prev => [...prev, ...cleaned]);
        setHasMore(cleaned.length === PAGE_SIZE);
        setCursor(cleaned.length ? cleaned[cleaned.length - 1].created_at : cursor);
      } catch (err) {
        console.error('Error:', err);
        setError('Something went wrong');
        setHasMore(false);
      } finally {
        setIsFetchingMore(false);
      }
    },
    [cursor, hasMore, isFetchingMore]
  );

  useEffect(() => {
    loadCommitments();
  }, []);

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
