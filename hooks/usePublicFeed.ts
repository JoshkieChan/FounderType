import { useState, useRef } from 'react';
import { PaginationService } from '../lib/apiPagination';
import { Commitment, CommitmentStatus } from '../types/commitment';
type Filter = CommitmentStatus | null;
export function usePublicFeed(statusFilter: Filter = 'active') {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const page = useRef(0);
  const generation = useRef(0);
  const fetchingMore = useRef(false);
  const filterRef = useRef(statusFilter);
  filterRef.current = statusFilter;
  const loadCommitments = async (filter: Filter = filterRef.current) => {
    const request = ++generation.current;
    fetchingMore.current = false;
    setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const response = await PaginationService.getCommitments(undefined, {
        page: 1,
        limit: 20,
        status: filter,
      });
      if (request !== generation.current) return;
      setCommitments(response.data);
      setHasMore(response.pagination.hasNext);
      page.current = 1;
    } catch {
      if (request === generation.current) {
        setError('Could not load the public feed. Please retry.');
        setHasMore(false);
      }
    } finally {
      if (request === generation.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };
  const loadMore = async (filter: Filter = filterRef.current) => {
    if (!hasMore || fetchingMore.current || loading) return;
    fetchingMore.current = true;
    const request = generation.current;
    setError(null);
    try {
      const response = await PaginationService.getCommitments(undefined, {
        page: page.current + 1,
        limit: 20,
        status: filter,
      });
      if (request !== generation.current) return;
      setCommitments((previous) => [
        ...previous,
        ...response.data.filter(
          (item) => !previous.some((old) => old.id === item.id)
        ),
      ]);
      page.current++;
      setHasMore(response.pagination.hasNext);
    } catch {
      if (request === generation.current)
        setError('Could not load more commitments. Please retry.');
    } finally {
      if (request === generation.current) fetchingMore.current = false;
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
