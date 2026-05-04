// Rate limiting utilities for API calls

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private static instances = new Map<string, RateLimiter>();
  private requests: Map<string, RateLimitEntry> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  static getInstance(
    key: string,
    maxRequests: number,
    windowMs: number
  ): RateLimiter {
    if (!RateLimiter.instances.has(key)) {
      RateLimiter.instances.set(key, new RateLimiter(maxRequests, windowMs));
    }
    return RateLimiter.instances.get(key)!;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false; // Rate limit exceeded
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(identifier: string): number | null {
    const entry = this.requests.get(identifier);
    if (!entry) return null;
    return entry.resetTime;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Rate limiting middleware for API calls
export class ApiRateLimiter {
  private static geminiLimiter = RateLimiter.getInstance('gemini', 10, 60000); // 10 requests per minute
  private static supabaseLimiter = RateLimiter.getInstance(
    'supabase',
    100,
    60000
  ); // 100 requests per minute
  private static commitmentLimiter = RateLimiter.getInstance(
    'commitment',
    5,
    60000
  ); // 5 commitments per minute

  static canCallGemini(userId: string): boolean {
    return this.geminiLimiter.isAllowed(userId);
  }

  static canCallSupabase(userId: string): boolean {
    return this.supabaseLimiter.isAllowed(userId);
  }

  static canCreateCommitment(userId: string): boolean {
    return this.commitmentLimiter.isAllowed(userId);
  }

  static getGeminiRateLimit(userId: string) {
    return {
      remaining: this.geminiLimiter.getRemainingRequests(userId),
      resetTime: this.geminiLimiter.getResetTime(userId),
    };
  }

  static getSupabaseRateLimit(userId: string) {
    return {
      remaining: this.supabaseLimiter.getRemainingRequests(userId),
      resetTime: this.supabaseLimiter.getResetTime(userId),
    };
  }

  static getCommitmentRateLimit(userId: string) {
    return {
      remaining: this.commitmentLimiter.getRemainingRequests(userId),
      resetTime: this.commitmentLimiter.getResetTime(userId),
    };
  }

  // Cleanup old entries periodically
  static cleanup() {
    this.geminiLimiter.cleanup();
    this.supabaseLimiter.cleanup();
    this.commitmentLimiter.cleanup();
  }
}

// Auto-cleanup every 5 minutes
setInterval(
  () => {
    ApiRateLimiter.cleanup();
  },
  5 * 60 * 1000
);
