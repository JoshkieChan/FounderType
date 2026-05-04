// Database optimization utilities for scaling

export interface DatabaseIndex {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  unique?: boolean;
  partial?: string; // WHERE clause for partial index
}

export interface QueryOptimization {
  query: string;
  indexes: DatabaseIndex[];
  explanation: string;
}

export class DatabaseOptimizer {
  // Recommended indexes for scaling
  static readonly RECOMMENDED_INDEXES: DatabaseIndex[] = [
    // Profiles table
    {
      table: 'profiles',
      columns: ['id'],
      type: 'btree',
      unique: true,
    },
    {
      table: 'profiles',
      columns: ['created_at'],
      type: 'btree',
    },
    {
      table: 'profiles',
      columns: ['updated_at'],
      type: 'btree',
    },

    // Commitments table
    {
      table: 'commitments',
      columns: ['id'],
      type: 'btree',
      unique: true,
    },
    {
      table: 'commitments',
      columns: ['user_id', 'created_at'],
      type: 'btree',
    },
    {
      table: 'commitments',
      columns: ['status', 'created_at'],
      type: 'btree',
    },
    {
      table: 'commitments',
      columns: ['deadline'],
      type: 'btree',
    },
    {
      table: 'commitments',
      columns: ['public'],
      type: 'btree',
      partial: 'public = true',
    },

    // Commitment check-ins
    {
      table: 'commitment_checkins',
      columns: ['commitment_id', 'date'],
      type: 'btree',
      unique: true,
    },
    {
      table: 'commitment_checkins',
      columns: ['user_id', 'date'],
      type: 'btree',
    },

    // User sessions for analytics
    {
      table: 'user_sessions',
      columns: ['user_id', 'created_at'],
      type: 'btree',
    },
    {
      table: 'user_sessions',
      columns: ['session_token'],
      type: 'btree',
      unique: true,
    },
  ];

  // Generate SQL for creating indexes
  static generateIndexSQL(index: DatabaseIndex): string {
    const indexName = `idx_${index.table}_${index.columns.join('_')}`;
    const uniqueClause = index.unique ? 'UNIQUE ' : '';
    const partialClause = index.partial ? ` WHERE ${index.partial}` : '';

    return `CREATE ${uniqueClause}INDEX ${indexName} 
            ON ${index.table} USING ${index.type} (${index.columns.join(', ')})${partialClause};`;
  }

  // Generate all index creation SQL
  static generateAllIndexesSQL(): string {
    return this.RECOMMENDED_INDEXES.map((index) =>
      this.generateIndexSQL(index)
    ).join('\n');
  }

  // Query optimization suggestions
  static readonly QUERY_OPTIMIZATIONS: QueryOptimization[] = [
    {
      query:
        'SELECT * FROM commitments WHERE user_id = $1 ORDER BY created_at DESC',
      indexes: [
        {
          table: 'commitments',
          columns: ['user_id', 'created_at'],
          type: 'btree',
        },
      ],
      explanation:
        'Compound index on user_id and created_at for fast user commitment retrieval',
    },
    {
      query:
        'SELECT * FROM commitments WHERE public = true ORDER BY created_at DESC LIMIT 20',
      indexes: [
        {
          table: 'commitments',
          columns: ['public', 'created_at'],
          type: 'btree',
          partial: 'public = true',
        },
      ],
      explanation: 'Partial index on public commitments for feed performance',
    },
    {
      query:
        'SELECT * FROM commitment_checkins WHERE commitment_id = $1 AND date >= $2',
      indexes: [
        {
          table: 'commitment_checkins',
          columns: ['commitment_id', 'date'],
          type: 'btree',
        },
      ],
      explanation: 'Compound index for check-in date range queries',
    },
  ];

  // Analyze query performance
  static analyzeQuery(query: string): QueryOptimization | null {
    return (
      this.QUERY_OPTIMIZATIONS.find((opt) =>
        query
          .toLowerCase()
          .includes(
            opt.query.toLowerCase().split('FROM')[1]?.split(' ')[0] || ''
          )
      ) || null
    );
  }

  // Generate partitioning strategy for large tables
  static generatePartitioningSQL(): string {
    return `
-- Partition commitments table by month for better performance
CREATE TABLE commitments_partitioned (
  LIKE commitments INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE commitments_2024_01 PARTITION OF commitments_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE commitments_2024_02 PARTITION OF commitments_partitioned
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Add more partitions as needed
`;
  }

  // Generate vacuum and analyze commands
  static generateMaintenanceSQL(): string {
    return `
-- Regular maintenance for optimal performance
VACUUM ANALYZE profiles;
VACUUM ANALYZE commitments;
VACUUM ANALYZE commitment_checkins;
VACUUM ANALYZE user_sessions;

-- Update table statistics
ANALYZE profiles;
ANALYZE commitments;
ANALYZE commitment_checkins;
ANALYZE user_sessions;
`;
  }

  // Connection pool configuration
  static getConnectionPoolConfig() {
    return {
      max: 20, // Maximum connections
      min: 5, // Minimum connections
      idle: 10000, // Idle timeout
      acquire: 30000, // Acquire timeout
      evict: 1000, // Eviction timeout
      handleDisconnects: true,
    };
  }
}

// Query performance monitor
export class QueryPerformanceMonitor {
  private static queryTimes: Map<string, number[]> = new Map();

  static recordQuery(query: string, duration: number): void {
    const key = query.split('FROM')[1]?.split(' ')[0] || 'unknown';
    const times = this.queryTimes.get(key) || [];
    times.push(duration);

    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }

    this.queryTimes.set(key, times);
  }

  static getAverageQueryTime(table: string): number {
    const times = this.queryTimes.get(table) || [];
    return times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;
  }

  static getSlowQueries(threshold: number = 1000): string[] {
    const slowQueries: string[] = [];

    for (const [table, times] of this.queryTimes.entries()) {
      const avg = this.getAverageQueryTime(table);
      if (avg > threshold) {
        slowQueries.push(`${table}: ${avg.toFixed(2)}ms average`);
      }
    }

    return slowQueries;
  }
}
