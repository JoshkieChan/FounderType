// Cached Supabase client wrapper
// Wraps Supabase queries with client-side caching to reduce API calls
import { supabase } from './supabase';
import { cachedAPI } from './clientCache';

export interface CachedQueryOptions {
  cacheTTL?: number; // Time to live in milliseconds
  skipCache?: boolean; // Force refresh
}

// Cache key generator for Supabase queries
function generateCacheKey(
  table: string,
  operation: string,
  query: any
): string {
  return `supabase:${table}:${operation}:${JSON.stringify(query)}`;
}

// Cached select query
export async function cachedSelect<T>(
  table: string,
  options: CachedQueryOptions = {}
): Promise<T | null> {
  const { cacheTTL = 60000, skipCache = false } = options;

  if (skipCache) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;
    return data as T;
  }

  const cacheKey = generateCacheKey(table, 'select', {});

  try {
    const cached = cachedAPI.request<T>(`/supabase/${table}`, {}, cacheTTL);
    return cached;
  } catch (error) {
    // Fallback to direct query if cache fails
    const { data, error: supabaseError } = await supabase
      .from(table)
      .select('*');
    if (supabaseError) throw supabaseError;
    return data as T;
  }
}

// Cached select with filters
export async function cachedSelectWithFilters<T>(
  table: string,
  filters: Record<string, any>,
  options: CachedQueryOptions = {}
): Promise<T | null> {
  const { cacheTTL = 60000, skipCache = false } = options;

  if (skipCache) {
    let query = supabase.from(table).select('*');
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error } = await query;
    if (error) throw error;
    return data as T;
  }

  const cacheKey = generateCacheKey(table, 'select', filters);

  try {
    const cached = cachedAPI.request<T>(
      `/supabase/${table}?${JSON.stringify(filters)}`,
      {},
      cacheTTL
    );
    return cached;
  } catch (error) {
    // Fallback to direct query if cache fails
    let query = supabase.from(table).select('*');
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error: supabaseError } = await query;
    if (supabaseError) throw supabaseError;
    return data as T;
  }
}

// Cached insert (invalidates related cache)
export async function cachedInsert<T>(
  table: string,
  data: any,
  options: CachedQueryOptions = {}
): Promise<T | null> {
  const { error } = await supabase.from(table).insert(data);
  if (error) throw error;

  // Invalidate cache for this table
  cachedAPI.invalidateCommitmentCache();

  return data as T;
}

// Cached update (invalidates related cache)
export async function cachedUpdate<T>(
  table: string,
  filters: Record<string, any>,
  data: any,
  options: CachedQueryOptions = {}
): Promise<T | null> {
  let query = supabase.from(table).update(data);
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { error } = await query;
  if (error) throw error;

  // Invalidate cache for this table
  cachedAPI.invalidateCommitmentCache();

  return data as T;
}

// Cached delete (invalidates related cache)
export async function cachedDelete(
  table: string,
  filters: Record<string, any>,
  options: CachedQueryOptions = {}
): Promise<void> {
  let query = supabase.from(table).delete();
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { error } = await query;
  if (error) throw error;

  // Invalidate cache for this table
  cachedAPI.invalidateCommitmentCache();
}

// Cached upsert (invalidates related cache)
export async function cachedUpsert<T>(
  table: string,
  data: any,
  options: CachedQueryOptions = {}
): Promise<T | null> {
  const { error } = await supabase.from(table).upsert(data);
  if (error) throw error;

  // Invalidate cache for this table
  cachedAPI.invalidateCommitmentCache();

  return data as T;
}

// Specific cached methods for common queries
export const cachedSupabase = {
  // Commitments
  getCommitments: (page = 1, limit = 20) =>
    cachedSelectWithFilters(
      'commitments',
      { is_public: true },
      { cacheTTL: 30000 }
    ),

  getUserCommitments: (userId: string) =>
    cachedSelectWithFilters(
      'commitments',
      { user_id: userId },
      { cacheTTL: 60000 }
    ),

  getCommitmentById: (id: string) =>
    cachedSelectWithFilters('commitments', { id }, { cacheTTL: 120000 }),

  // Profiles
  getUserProfile: (userId: string) =>
    cachedSelectWithFilters(
      'profiles',
      { user_id: userId },
      { cacheTTL: 1800000 }
    ),

  // Daily Progress
  getDailyProgress: (commitmentId: string) =>
    cachedSelectWithFilters(
      'daily_progress',
      { commitment_id: commitmentId },
      { cacheTTL: 60000 }
    ),

  // Write operations (with cache invalidation)
  insertCommitment: (data: any) => cachedInsert('commitments', data),
  updateCommitment: (id: string, data: any) =>
    cachedUpdate('commitments', { id }, data),
  deleteCommitment: (id: string) => cachedDelete('commitments', { id }),

  insertDailyProgress: (data: any) => cachedInsert('daily_progress', data),
  updateDailyProgress: (commitmentId: string, dayNumber: number, data: any) =>
    cachedUpdate(
      'daily_progress',
      { commitment_id: commitmentId, day_number: dayNumber },
      data
    ),

  upsertProfile: (data: any) => cachedUpsert('profiles', data),
  updateProfile: (userId: string, data: any) =>
    cachedUpdate('profiles', { user_id: userId }, data),
};

// Export the original supabase client for direct access when needed
export { supabase };
