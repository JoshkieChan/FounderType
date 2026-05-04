// FREE scaling optimizations for FounderType
// Uses existing free tiers: Vercel, Supabase, browser caching

export interface FreeScalingConfig {
  vercel: {
    regions: string[];
    functions: {
      maxDuration: number;
      memory: number;
    };
  };
  supabase: {
    connectionPooling: boolean;
    caching: boolean;
    optimizations: boolean;
  };
  client: {
    caching: boolean;
    bundleOptimization: boolean;
    lazyLoading: boolean;
  };
}

export class FreeScalingOptimizer {
  private static config: FreeScalingConfig = {
    vercel: {
      regions: ['iad1', 'hnd1'], // Free tier regions
      functions: {
        maxDuration: 10, // Free tier limit
        memory: 512, // Free tier limit
      },
    },
    supabase: {
      connectionPooling: true,
      caching: true,
      optimizations: true,
    },
    client: {
      caching: true,
      bundleOptimization: true,
      lazyLoading: true,
    },
  };

  // Generate Vercel configuration for free tier
  static getVercelConfig(): any {
    return {
      version: 2,
      builds: [
        {
          src: 'package.json',
          use: '@vercel/static-build',
          config: {
            distDir: 'web-build',
          },
        },
        {
          src: 'server.js',
          use: '@vercel/node',
        },
      ],
      routes: [
        {
          src: '/api/(.*)',
          dest: '/api/$1',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
        },
        {
          src: '/(.*)',
          dest: '/$1',
        },
      ],
      regions: this.config.vercel.regions,
      functions: {
        'api/**/*.js': {
          maxDuration: this.config.vercel.functions.maxDuration,
          memory: this.config.vercel.functions.memory,
        },
      },
      headers: [
        {
          source: '/static/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/_next/static/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
      ],
    };
  }

  // Generate Supabase optimizations for free tier
  static getSupabaseOptimizations(): string {
    return `
-- Free tier Supabase optimizations
-- These queries can be run in Supabase SQL Editor

-- 1. Add essential indexes for free tier
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_commitments_user_created 
ON commitments(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_commitments_public_created 
ON commitments(public, created_at DESC) 
WHERE public = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- 2. Optimize queries with limits
-- Replace unlimited queries with paginated ones
-- Example: SELECT * FROM commitments ORDER BY created_at DESC LIMIT 50

-- 3. Enable Row Level Security for performance
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create optimized views for common queries
CREATE OR REPLACE VIEW public.commitments_feed AS
SELECT 
  c.id,
  c.title,
  c.description,
  c.created_at,
  p.name as author_name,
  p.avatar_url
FROM commitments c
JOIN profiles p ON c.user_id = p.id
WHERE c.public = true
ORDER BY c.created_at DESC
LIMIT 100;

-- 5. Add function for efficient pagination
CREATE OR REPLACE FUNCTION get_paginated_commitments(
  page_size INTEGER DEFAULT 20,
  page_number INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  author_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.created_at,
    p.name as author_name
  FROM commitments c
  JOIN profiles p ON c.user_id = p.id
  WHERE c.public = true
  ORDER BY c.created_at DESC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql;
`;
  }

  // Client-side caching utilities
  static getClientCachingCode(): string {
    return `
// Client-side caching for free scaling
class ClientCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100; // Limit cache size
  }

  set(key, data, ttl = 300000) { // 5 minutes default
    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

// Usage example
const cache = new ClientCache();

// Cache API responses
const cachedData = cache.get('user-profile');
if (cachedData) {
  return cachedData;
}

const response = await fetch('/api/profile');
const data = await response.json();
cache.set('user-profile', data);
`;
  }

  // Bundle optimization suggestions
  static getBundleOptimizations(): string[] {
    return [
      'Use dynamic imports for heavy components',
      'Implement code splitting for routes',
      'Optimize images with next/image',
      'Remove unused dependencies',
      'Use tree shaking for dead code elimination',
      'Minimize and compress assets',
      'Use CDN for external libraries',
    ];
  }

  // Free monitoring setup
  static getFreeMonitoringCode(): string {
    return `
// Free monitoring with Vercel Analytics and browser tools
class FreeMonitoring {
  static trackPerformance() {
    // Track page load times
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
      
      // Log to console for free monitoring
      console.log('Page load time:', loadTime + 'ms');
      
      // Track in localStorage for trend analysis
      const metrics = JSON.parse(localStorage.getItem('metrics') || '[]');
      metrics.push({
        timestamp: Date.now(),
        loadTime,
        url: window.location.href
      });
      
      // Keep only last 100 entries
      if (metrics.length > 100) {
        metrics.shift();
      }
      
      localStorage.setItem('metrics', JSON.stringify(metrics));
    });
  }

  static trackAPIPerformance(url, duration) {
    const apiMetrics = JSON.parse(localStorage.getItem('apiMetrics') || '[]');
    apiMetrics.push({
      timestamp: Date.now(),
      url,
      duration
    });
    
    if (apiMetrics.length > 100) {
      apiMetrics.shift();
    }
    
    localStorage.setItem('apiMetrics', JSON.stringify(apiMetrics));
  }

  static getMetrics() {
    return {
      pageMetrics: JSON.parse(localStorage.getItem('metrics') || '[]'),
      apiMetrics: JSON.parse(localStorage.getItem('apiMetrics') || '[]')
    };
  }
}

// Initialize monitoring
FreeMonitoring.trackPerformance();
`;
  }

  // Lazy loading implementation
  static getLazyLoadingCode(): string {
    return `
// Lazy loading for better performance
const LazyLoader = {
  // Lazy load components
  loadComponent: async (componentPath) => {
    const module = await import(componentPath);
    return module.default;
  },

  // Lazy load images
  loadImage: (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },

  // Intersection Observer for lazy loading
  observeElements: (callback) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all elements with data-lazy attribute
    document.querySelectorAll('[data-lazy]').forEach(el => {
      observer.observe(el);
    });
  }
};
`;
  }

  // Generate complete free scaling guide
  static getFreeScalingGuide(): string {
    return `
# FREE FounderType Scaling Guide

## 🆓 Free Tier Capabilities
- **Vercel**: 100GB bandwidth, 10k requests/month
- **Supabase**: 500MB database, 2GB bandwidth
- **Client caching**: Unlimited local storage

## 🚀 Optimization Strategies

### 1. Vercel Optimizations
- Enable Edge Functions for global distribution
- Use ISR (Incremental Static Regeneration)
- Optimize build size for faster deployments

### 2. Supabase Optimizations
- Add essential indexes
- Use connection pooling
- Implement pagination
- Enable Row Level Security

### 3. Client-Side Optimizations
- Implement browser caching
- Use lazy loading
- Optimize bundle size
- Add service worker

## 📊 Scaling Limits
- **1K users**: ✅ Easy on free tier
- **10K users**: ✅ Manageable with optimizations
- **50K users**: ⚠️ Need to optimize heavily
- **100K users**: ❌ Need paid plan

## 💡 Cost-Free Scaling Tips
1. Cache everything possible
2. Use CDN for static assets
3. Implement pagination
4. Optimize database queries
5. Monitor performance regularly
`;
  }
}

// Export for use in the application
export const freeScalingConfig = {
  vercel: {
    regions: ['iad1', 'hnd1'],
    functions: {
      maxDuration: 10,
      memory: 512,
    },
  },
  supabase: {
    connectionPooling: true,
    caching: true,
    optimizations: true,
  },
  client: {
    caching: true,
    bundleOptimization: true,
    lazyLoading: true,
  },
};
export const vercelConfig = FreeScalingOptimizer.getVercelConfig();
export const supabaseOptimizations =
  FreeScalingOptimizer.getSupabaseOptimizations();
