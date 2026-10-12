import { supabase } from './supabase';
import { Commitment, CommitmentStatus } from '../types/commitment';
export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: CommitmentStatus | null;
}
export class PaginationService {
  static async getCommitments(
    userId?: string,
    { page = 1, limit = 20, status = null }: PaginationParams = {}
  ) {
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1
    )
      throw new Error('Invalid pagination');
    limit = Math.min(limit, 100);
    let query = supabase.from('commitments').select('*', { count: 'exact' });
    query = userId ? query.eq('user_id', userId) : query.eq('is_public', true);
    if (status) query = query.eq('status', status);
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (error) throw error;
    return {
      data: (data || []) as Commitment[],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count || 0,
        hasNext: page * limit < (count || 0),
        hasPrev: page > 1,
      },
    };
  }
}
