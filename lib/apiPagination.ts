// API pagination to reduce data transfer and improve performance
import { cachedAPI } from './clientCache';

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

  // Generic paginated fetch
  static async fetchPaginated<T>(
    endpoint: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<T>> {
    const {
      page = 1,
      limit = this.DEFAULT_LIMIT,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params;

    // Validate limit
    const validLimit = Math.min(limit, this.MAX_LIMIT);

    const url = `${endpoint}?page=${page}&limit=${validLimit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    
    try {
      const response = await cachedAPI.request(url, {}, 60000); // 1 minute cache
      
      // Transform response to standard format
      return this.transformResponse(response, page, validLimit);
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
    const endpoint = userId ? `/api/users/${userId}/commitments` : '/api/commitments';
    return this.fetchPaginated(endpoint, params);
  }

  // Feed pagination
  static async getFeed(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    return this.fetchPaginated('/api/feed', params);
  }

  // User commitments pagination
  static async getUserCommitments(
    userId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    return this.fetchPaginated(`/api/users/${userId}/commitments`, params);
  }

  // Check-ins pagination
  static async getCommitmentCheckins(
    commitmentId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    return this.fetchPaginated(`/api/commitments/${commitmentId}/checkins`, params);
  }

  // Search with pagination
  static async searchCommitments(
    query: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    const endpoint = `/api/search?q=${encodeURIComponent(query)}`;
    return this.fetchPaginated(endpoint, params);
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
        hasPrev
      }
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
      endItem: Math.min(currentPage * limit, totalItems)
    };
  }

  // Infinite scroll helper
  static async loadMore<T>(
    endpoint: string,
    currentPage: number,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<T>> {
    return this.fetchPaginated(endpoint, {
      ...params,
      page: currentPage + 1
    });
  }

  // Preload next page for better UX
  static async preloadNext<T>(
    endpoint: string,
    currentPage: number,
    params: PaginationParams = {}
  ): Promise<void> {
    try {
      await this.loadMore<T>(endpoint, currentPage, params);
    } catch (error) {
      // Silent fail for preloading
      console.warn('Preload failed:', error);
    }
  }
}

// React hook for pagination
export function usePagination<T>(
  endpoint: string,
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
    hasPrev: false
  });
  const [params, setParams] = React.useState(initialParams);

  const loadPage = React.useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await PaginationService.fetchPaginated<T>(endpoint, {
        ...params,
        page
      });
      
      setData(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [endpoint, params]);

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
    setParams
  };
}

// Infinite scroll hook
export function useInfiniteScroll<T>(
  endpoint: string,
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
      const response = await PaginationService.fetchPaginated<T>(endpoint, {
        ...params,
        page: page + 1
      });

      setData(prev => [...prev, ...response.data]);
      setHasMore(response.pagination.hasNext);
      setPage(page + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more data');
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, params, loading, hasMore]);

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
    setParams
  };
}
