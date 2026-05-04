// API pagination to reduce data transfer and improve performance
import React from 'react';
import { cachedAPI } from './clientCache';
import { supabase } from './cachedSupabase';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class PaginationService {
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly MAX_LIMIT = 100;

  // Generic paginated fetch using Supabase
  static async fetchPaginated<T>(
    table: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<T>> {
    const {
      page = 1,
      limit = this.DEFAULT_LIMIT,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;

    // Validate limit
    const validLimit = Math.min(limit, this.MAX_LIMIT);

    try {
      // Build Supabase query
      let query = supabase.from(table).select('*', { count: 'exact' });

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const offset = (page - 1) * validLimit;
      query = query.range(offset, offset + validLimit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Supabase pagination error:', error);
        throw error;
      }

      // Transform response to standard format
      return this.transformResponse(
        { data, total: count || 0 },
        page,
        validLimit
      );
    } catch (error) {
      console.error('Pagination fetch error:', error);
      throw error;
    }
  }

  // Commitments pagination
  static async getCommitments(
    userId?: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    let query = supabase.from('commitments').select('*', { count: 'exact' });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const {
      page = 1,
      limit = this.DEFAULT_LIMIT,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;
    const validLimit = Math.min(limit, this.MAX_LIMIT);
    const offset = (page - 1) * validLimit;

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range(offset, offset + validLimit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return this.transformResponse(
      { data, total: count || 0 },
      page,
      validLimit
    );
  }

  // Feed pagination (public commitments)
  static async getFeed(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    return this.getCommitments(undefined, { ...params });
  }

  // User commitments pagination
  static async getUserCommitments(
    userId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    return this.getCommitments(userId, params);
  }

  // Check-ins pagination
  static async getCommitmentCheckins(
    commitmentId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      limit = this.DEFAULT_LIMIT,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;
    const validLimit = Math.min(limit, this.MAX_LIMIT);
    const offset = (page - 1) * validLimit;

    const { data, error, count } = await supabase
      .from('daily_progress')
      .select('*', { count: 'exact' })
      .eq('commitment_id', commitmentId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + validLimit - 1);

    if (error) throw error;

    return this.transformResponse(
      { data, total: count || 0 },
      page,
      validLimit
    );
  }

  // Search with pagination
  static async searchCommitments(
    query: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      limit = this.DEFAULT_LIMIT,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;
    const validLimit = Math.min(limit, this.MAX_LIMIT);
    const offset = (page - 1) * validLimit;

    const { data, error, count } = await supabase
      .from('commitments')
      .select('*', { count: 'exact' })
      .ilike('commitment_text', `%${query}%`)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + validLimit - 1);

    if (error) throw error;

    return this.transformResponse(
      { data, total: count || 0 },
      page,
      validLimit
    );
  }

  // Transform API response to standard format
  private static transformResponse<T>(
    response: any,
    currentPage: number,
    limit: number
  ): PaginatedResponse<T> {
    // Handle different response formats
    const data = response.data || response.items || response;
    const totalItems = response.total || response.count || response.length || 0;

    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;

    return {
      data: Array.isArray(data) ? data : [],
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        hasNext,
        hasPrev,
      },
    };
  }

  // Generate pagination metadata
  static generatePaginationMetadata(
    currentPage: number,
    limit: number,
    totalItems: number
  ) {
    const totalPages = Math.ceil(totalItems / limit);

    return {
      currentPage,
      totalPages,
      totalItems,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
      startItem: (currentPage - 1) * limit + 1,
      endItem: Math.min(currentPage * limit, totalItems),
    };
  }

  // Infinite scroll helper
  static async loadMore<T>(
    table: string,
    currentPage: number,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<T>> {
    return this.fetchPaginated<T>(table, {
      ...params,
      page: currentPage + 1,
    });
  }

  // Preload next page for better UX
  static async preloadNext<T>(
    table: string,
    currentPage: number,
    params: PaginationParams = {}
  ): Promise<void> {
    try {
      await this.loadMore<T>(table, currentPage, params);
    } catch (error) {
      // Silent fail for preloading
      console.warn('Preload failed:', error);
    }
  }
}

// React hook for pagination
export function usePagination<T>(
  table: string,
  initialParams: PaginationParams = {}
) {
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pagination, setPagination] = React.useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [params, setParams] = React.useState(initialParams);

  const loadPage = React.useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await PaginationService.fetchPaginated<T>(table, {
          ...params,
          page,
        });

        setData(response.data);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    },
    [table, params]
  );

  const loadNext = React.useCallback(() => {
    if (pagination.hasNext && !loading) {
      loadPage(pagination.currentPage + 1);
    }
  }, [pagination.hasNext, loading, loadPage]);

  const loadPrev = React.useCallback(() => {
    if (pagination.hasPrev && !loading) {
      loadPage(pagination.currentPage - 1);
    }
  }, [pagination.hasPrev, loading, loadPage]);

  const refresh = React.useCallback(() => {
    loadPage(pagination.currentPage);
  }, [loadPage]);

  // Initial load
  React.useEffect(() => {
    loadPage(1);
  }, []);

  return {
    data,
    loading,
    error,
    pagination,
    loadNext,
    loadPrev,
    refresh,
    setParams,
  };
}

// Infinite scroll hook
export function useInfiniteScroll<T>(
  table: string,
  initialParams: PaginationParams = {}
) {
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [params, setParams] = React.useState(initialParams);

  const loadMore = React.useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await PaginationService.fetchPaginated<T>(table, {
        ...params,
        page: page + 1,
      });

      setData((prev) => [...prev, ...response.data]);
      setHasMore(response.pagination.hasNext);
      setPage(page + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more data');
    } finally {
      setLoading(false);
    }
  }, [table, page, params, loading, hasMore]);

  const refresh = React.useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    loadMore();
  }, [loadMore]);

  // Initial load
  React.useEffect(() => {
    loadMore();
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    setParams,
  };
}
